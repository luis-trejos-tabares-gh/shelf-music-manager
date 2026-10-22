import "server-only";

import { after } from "next/server";
import { upsertLookedUpReleaseGroup } from "@/lib/catalog/ingest";
import { browseReleaseGroupsPage } from "@/lib/musicbrainz/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import {
  DISCOGRAPHY_PAGE_SIZE,
  type DiscographyBucket,
  type DiscographyRow,
} from "@/lib/catalog/discography-shared";

export {
  DISCOGRAPHY_PAGE_SIZE,
  DISCOGRAPHY_SECTIONS,
  type DiscographyBucket,
  type DiscographyRelease,
  type DiscographyRow,
} from "@/lib/catalog/discography-shared";

const DISCOGRAPHY_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const BROWSE_PAGE_SIZE = 100;

export function classifyReleaseGroup(input: {
  primaryType: string | null;
  secondaryTypes: string[];
  creditCount: number;
}): DiscographyBucket {
  const secondary = new Set(input.secondaryTypes.map((value) => value.toLowerCase()));
  const primary = (input.primaryType ?? "").toLowerCase();
  const isCompilation = secondary.has("compilation");

  if (input.creditCount >= 2 && !isCompilation) {
    return "splits";
  }

  if (secondary.has("live")) {
    return "live";
  }

  if (isCompilation) {
    return "compilations";
  }

  if (secondary.has("soundtrack")) {
    return "soundtracks";
  }

  if (primary === "ep") {
    return "eps";
  }

  if (primary === "album" && secondary.size === 0) {
    return "albums";
  }

  if (primary === "single") {
    return "singles";
  }

  return "other";
}

async function upsertReleaseGroups(
  groups: Array<Parameters<typeof upsertLookedUpReleaseGroup>[0]>,
) {
  for (const group of groups) {
    await upsertLookedUpReleaseGroup(group);
  }
}

async function finishArtistDiscography(
  artistId: string,
  mbid: string,
  startOffset: number,
) {
  let offset = startOffset;

  while (true) {
    const page = await browseReleaseGroupsPage(mbid, offset, BROWSE_PAGE_SIZE);
    await upsertReleaseGroups(page.groups);
    offset += page.groups.length;

    if (page.groups.length < BROWSE_PAGE_SIZE || offset >= page.count) {
      break;
    }
  }

  const admin = createAdminClient();
  await admin
    .from("artists")
    .update({ discography_fetched_at: new Date().toISOString() })
    .eq("id", artistId);
}

export async function ensureArtistDiscography(artistId: string) {
  const admin = createAdminClient();
  const { data: artist, error } = await admin
    .from("artists")
    .select("id, mbid, discography_fetched_at")
    .eq("id", artistId)
    .single();

  if (error || !artist) {
    return;
  }

  const fetchedAt = artist.discography_fetched_at
    ? new Date(artist.discography_fetched_at).getTime()
    : 0;
  const stale = Date.now() - fetchedAt > DISCOGRAPHY_TTL_MS;

  if (!stale) {
    return;
  }

  const first = await browseReleaseGroupsPage(artist.mbid, 0, BROWSE_PAGE_SIZE);
  await upsertReleaseGroups(first.groups);

  if (first.groups.length < BROWSE_PAGE_SIZE || first.groups.length >= first.count) {
    await admin
      .from("artists")
      .update({ discography_fetched_at: new Date().toISOString() })
      .eq("id", artistId);
    return;
  }

  after(() => finishArtistDiscography(artist.id, artist.mbid, first.groups.length));
}

export async function getArtistDiscography(
  artistId: string,
  showHidden: boolean,
) {
  const supabase = await createClient();
  const [
    { data: credits },
    { data: albumCollections },
    { data: hiddenRows },
  ] = await Promise.all([
    supabase
      .from("release_artists")
      .select(
        "releases(id, mbid, title, type, secondary_types, release_date, cover_url)",
      )
      .eq("artist_id", artistId),
    supabase.from("collections").select("id, name").eq("kind", "album").order("name"),
    supabase.from("hidden_releases").select("release_id"),
  ]);

  const albums = [
    ...new Map(
      (credits ?? [])
        .map((row) => row.releases)
        .filter((release): release is NonNullable<typeof release> => Boolean(release))
        .map((release) => [release.id, release]),
    ).values(),
  ];
  const releaseIds = albums.map((album) => album.id);

  const [{ data: allCredits }, { data: albumMemberships }] = await Promise.all([
    releaseIds.length
      ? supabase
          .from("release_artists")
          .select("release_id")
          .in("release_id", releaseIds)
      : Promise.resolve({ data: [] }),
    releaseIds.length
      ? supabase
          .from("collection_items")
          .select("id, release_id, collections(id, name)")
          .in("release_id", releaseIds)
      : Promise.resolve({ data: [] }),
  ]);

  const creditCount = new Map<string, number>();
  for (const row of allCredits ?? []) {
    creditCount.set(row.release_id, (creditCount.get(row.release_id) ?? 0) + 1);
  }

  const membershipsByRelease = new Map<
    string,
    Array<{ id: string; name: string; itemId: string }>
  >();
  for (const row of albumMemberships ?? []) {
    if (!row.release_id || !row.collections) {
      continue;
    }
    const list = membershipsByRelease.get(row.release_id) ?? [];
    list.push({
      id: row.collections.id,
      name: row.collections.name,
      itemId: row.id,
    });
    membershipsByRelease.set(row.release_id, list);
  }

  const hiddenIds = new Set((hiddenRows ?? []).map((row) => row.release_id));
  const listed = showHidden ? albums : albums.filter((album) => !hiddenIds.has(album.id));
  const collections = albumCollections ?? [];

  const grouped = new Map<DiscographyBucket, DiscographyRow[]>();
  for (const album of listed) {
    const bucket = classifyReleaseGroup({
      primaryType: album.type,
      secondaryTypes: album.secondary_types ?? [],
      creditCount: creditCount.get(album.id) ?? 1,
    });
    const inCollections = membershipsByRelease.get(album.id) ?? [];
    const inIds = new Set(inCollections.map((collection) => collection.id));
    const list = grouped.get(bucket) ?? [];
    list.push({
      album: {
        id: album.id,
        mbid: album.mbid,
        title: album.title,
        release_date: album.release_date,
        cover_url: album.cover_url,
      },
      inCollections,
      availableCollections: collections.filter((collection) => !inIds.has(collection.id)),
      hidden: hiddenIds.has(album.id),
    });
    grouped.set(bucket, list);
  }

  for (const list of grouped.values()) {
    list.sort((left, right) =>
      (right.album.release_date ?? "").localeCompare(left.album.release_date ?? ""),
    );
  }

  return {
    grouped,
    hiddenCount: hiddenIds.size,
    hasAlbumCollections: collections.length > 0,
    totalReleases: albums.length,
  };
}

export async function getDiscographySectionPage(
  artistId: string,
  bucket: DiscographyBucket,
  showHidden: boolean,
  offset = 0,
  limit = DISCOGRAPHY_PAGE_SIZE,
) {
  const { grouped, hasAlbumCollections } = await getArtistDiscography(
    artistId,
    showHidden,
  );
  const items = grouped.get(bucket) ?? [];

  return {
    items: items.slice(offset, offset + limit),
    total: items.length,
    hasAlbumCollections,
  };
}
