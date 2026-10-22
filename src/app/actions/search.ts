"use server";

import {
  flattenReleaseTracks,
  formatArtistCredit,
  pickCanonicalRelease,
  previewArtistSummary,
} from "@/lib/catalog/ingest";
import { firstImageUrl } from "@/lib/catalog/media";
import { lookupArtist, browseReleases, lookupRecording } from "@/lib/musicbrainz/client";
import { fetchWikipediaArtistPreview } from "@/lib/wikipedia/client";
import { createClient } from "@/lib/supabase/server";
import type { AlbumDetails } from "@/app/actions/discography";

export type SearchMembership = {
  id: string;
  name: string;
  itemId: string;
};

export type ArtistPreview = {
  bio: string | null;
  thumbnailUrl: string | null;
};

export async function previewArtistProfile(mbid: string): Promise<ArtistPreview> {
  const lookup = await lookupArtist(mbid);
  const summary = await previewArtistSummary(lookup);
  return {
    bio: summary.bio,
    thumbnailUrl: summary.thumbnailUrl,
  };
}

export async function enrichArtistSearchHits(
  hits: Array<{ mbid: string; name: string; disambiguation?: string | null }>,
) {
  const supabase = await createClient();
  const mbids = hits.map((hit) => hit.mbid);
  const { data: existing } = mbids.length
    ? await supabase
        .from("artists")
        .select("id, mbid, bio, images")
        .in("mbid", mbids)
    : { data: [] };

  const byMbid = new Map((existing ?? []).map((row) => [row.mbid, row]));
  const artistIds = (existing ?? []).map((row) => row.id);
  const { data: memberships } = artistIds.length
    ? await supabase
        .from("collection_items")
        .select("id, artist_id, collections(id, name)")
        .in("artist_id", artistIds)
    : { data: [] };

  const membershipsByArtist = new Map<string, SearchMembership[]>();
  for (const row of memberships ?? []) {
    if (!row.artist_id || !row.collections) {
      continue;
    }
    const list = membershipsByArtist.get(row.artist_id) ?? [];
    list.push({
      id: row.collections.id,
      name: row.collections.name,
      itemId: row.id,
    });
    membershipsByArtist.set(row.artist_id, list);
  }

  const previews = await Promise.all(
    hits.map(async (hit) => {
      const row = byMbid.get(hit.mbid);
      const coverUrl = firstImageUrl(row?.images);
      const bio = row?.bio ?? null;
      if (coverUrl && bio) {
        return {
          mbid: hit.mbid,
          coverUrl,
          bio,
          inCollections: row ? membershipsByArtist.get(row.id) ?? [] : [],
        };
      }

      const summary = await fetchWikipediaArtistPreview(
        hit.name,
        hit.disambiguation,
      );

      return {
        mbid: hit.mbid,
        coverUrl: coverUrl ?? summary?.thumbnailUrl ?? null,
        bio: bio ?? summary?.extract ?? null,
        inCollections: row ? membershipsByArtist.get(row.id) ?? [] : [],
      };
    }),
  );

  return new Map(previews.map((preview) => [preview.mbid, preview]));
}

export async function loadSearchMemberships(
  kind: "album" | "recording",
  mbids: string[],
) {
  const supabase = await createClient();
  if (!mbids.length) {
    return new Map<string, SearchMembership[]>();
  }

  if (kind === "album") {
    const { data: releases } = await supabase
      .from("releases")
      .select("id, mbid")
      .in("mbid", mbids);
    const ids = (releases ?? []).map((row) => row.id);
    const { data: memberships } = ids.length
      ? await supabase
          .from("collection_items")
          .select("id, release_id, collections(id, name)")
          .in("release_id", ids)
      : { data: [] };
    const byRelease = new Map<string, SearchMembership[]>();
    for (const row of memberships ?? []) {
      if (!row.release_id || !row.collections) {
        continue;
      }
      const list = byRelease.get(row.release_id) ?? [];
      list.push({
        id: row.collections.id,
        name: row.collections.name,
        itemId: row.id,
      });
      byRelease.set(row.release_id, list);
    }
    return new Map(
      (releases ?? []).map((row) => [row.mbid, byRelease.get(row.id) ?? []]),
    );
  }

  const { data: recordings } = await supabase
    .from("recordings")
    .select("id, mbid")
    .in("mbid", mbids);
  const ids = (recordings ?? []).map((row) => row.id);
  const { data: memberships } = ids.length
    ? await supabase
        .from("collection_items")
        .select("id, recording_id, collections(id, name)")
        .in("recording_id", ids)
    : { data: [] };
  const byRecording = new Map<string, SearchMembership[]>();
  for (const row of memberships ?? []) {
    if (!row.recording_id || !row.collections) {
      continue;
    }
    const list = byRecording.get(row.recording_id) ?? [];
    list.push({
      id: row.collections.id,
      name: row.collections.name,
      itemId: row.id,
    });
    byRecording.set(row.recording_id, list);
  }
  return new Map(
    (recordings ?? []).map((row) => [row.mbid, byRecording.get(row.id) ?? []]),
  );
}

export type RecordingPreview = {
  lengthMs: number | null;
  credit: string | null;
  albums: Array<{ title: string; date: string | null }>;
};

export async function previewAlbumDetails(mbid: string): Promise<AlbumDetails> {
  const official = await browseReleases(mbid, "official");
  const canonical = pickCanonicalRelease(official);

  if (!canonical) {
    return {
      labelName: null,
      durationMs: null,
      albumCredit: formatArtistCredit(undefined),
      tracks: [],
    };
  }

  const tracks = flattenReleaseTracks(canonical);
  const albumCredit = formatArtistCredit(canonical["artist-credit"]);
  const durationMs = tracks.reduce<number | null>((total, track) => {
    const length = track.length ?? track.recording?.length ?? null;
    if (length == null) {
      return total;
    }
    return (total ?? 0) + length;
  }, null);

  return {
    labelName:
      canonical["label-info"]?.map((info) => info.label?.name).find(Boolean) ??
      null,
    durationMs,
    albumCredit,
    tracks: tracks.map((track, index) => ({
      id: null,
      position: track.position ?? index + 1,
      title: track.title ?? track.recording?.title ?? "Untitled",
      lengthMs: track.length ?? track.recording?.length ?? null,
      creditName: formatArtistCredit(track.recording?.["artist-credit"]),
    })),
  };
}

export async function previewRecordingDetails(
  mbid: string,
): Promise<RecordingPreview> {
  const recording = await lookupRecording(mbid, "artist-credits+releases");

  return {
    lengthMs: recording.length ?? null,
    credit: formatArtistCredit(recording["artist-credit"]),
    albums: (recording.releases ?? []).map((release) => ({
      title: release.title,
      date: release.date?.slice(0, 4) ?? null,
    })),
  };
}
