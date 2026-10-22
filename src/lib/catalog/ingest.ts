import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  browseReleases,
  lookupArtist,
  lookupRecording,
  lookupReleaseGroup,
  type MusicBrainzArtist,
  type MusicBrainzArtistCredit,
  type MusicBrainzRecording,
  type MusicBrainzRelease,
  type MusicBrainzReleaseGroup,
} from "@/lib/musicbrainz/client";
import type { CollectionKind } from "@/lib/catalog/types";
import { coverArtFrontUrl, findCoverArtUrl } from "@/lib/coverart/client";
import { annotationText, isEmptyUrls, mapUrlRelations, urlsRecord } from "@/lib/catalog/urls";
import {
  fetchEnwikiTitleFromWikidata,
  fetchWikipediaSummary,
  fetchWikipediaSummaryByTitle,
} from "@/lib/wikipedia/client";

function parseReleaseDate(value?: string) {
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    return `${value}-01`;
  }

  if (/^\d{4}$/.test(value)) {
    return `${value}-01-01`;
  }

  return null;
}

function creditName(credits?: MusicBrainzArtistCredit[]) {
  if (!credits?.length) {
    return null;
  }

  return credits
    .map((credit) => `${credit.name}${credit.joinphrase ?? ""}`)
    .join("")
    .trim() || null;
}

async function upsertArtistFromCredit(credit: MusicBrainzArtistCredit) {
  if (!credit.artist?.id) {
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("artists")
    .upsert(
      {
        mbid: credit.artist.id,
        name: credit.artist.name || credit.name,
      },
      { onConflict: "mbid" },
    )
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function upsertArtistsFromCredits(credits?: MusicBrainzArtistCredit[]) {
  const rows = [];

  for (const [index, credit] of (credits ?? []).entries()) {
    const artist = await upsertArtistFromCredit(credit);
    if (artist) {
      rows.push({ artist, credit, position: index });
    }
  }

  return rows;
}

export async function previewArtistSummary(lookup: MusicBrainzArtist) {
  const urls = mapUrlRelations(lookup.relations);
  let bio = annotationText(lookup.annotation, lookup.disambiguation);
  let thumbnailUrl: string | null = null;

  let summary = urls.wikipedia
    ? await fetchWikipediaSummary(urls.wikipedia)
    : null;

  if (!summary && urls.wikidata) {
    const title = await fetchEnwikiTitleFromWikidata(urls.wikidata);
    if (title) {
      summary = await fetchWikipediaSummaryByTitle(title);
      if (summary?.wikipediaUrl) {
        urls.wikipedia = summary.wikipediaUrl;
      }
    }
  }

  if (summary?.extract) {
    bio = summary.extract;
  }

  if (summary?.thumbnailUrl) {
    thumbnailUrl = summary.thumbnailUrl;
  }

  return { bio, thumbnailUrl, urls };
}

export async function ingestArtist(mbid: string) {
  const lookup = await lookupArtist(mbid);
  return upsertLookedUpArtist(lookup);
}

async function upsertLookedUpArtist(lookup: MusicBrainzArtist) {
  const admin = createAdminClient();
  const { bio, thumbnailUrl, urls } = await previewArtistSummary(lookup);

  const { data, error } = await admin
    .from("artists")
    .upsert(
      {
        mbid: lookup.id,
        name: lookup.name,
        bio,
        urls,
        ...(thumbnailUrl
          ? { images: [{ url: thumbnailUrl, source: "wikipedia" }] }
          : {}),
      },
      { onConflict: "mbid" },
    )
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function ingestReleaseGroup(mbid: string) {
  const lookup = await lookupReleaseGroup(mbid);
  const release = await upsertLookedUpReleaseGroup(lookup, { probeCover: true });
  await enrichCanonicalRelease(release.id);
  return release;
}

export async function upsertLookedUpReleaseGroup(
  lookup: MusicBrainzReleaseGroup,
  options: { probeCover?: boolean } = {},
) {
  const admin = createAdminClient();
  const artists = await upsertArtistsFromCredits(lookup["artist-credit"]);

  const probed = options.probeCover ? await findCoverArtUrl(lookup.id) : null;
  const coverUrl = probed ?? coverArtFrontUrl(lookup.id);

  const { data: release, error } = await admin
    .from("releases")
    .upsert(
      {
        mbid: lookup.id,
        title: lookup.title,
        type: lookup["primary-type"] ?? null,
        secondary_types: lookup["secondary-types"] ?? [],
        release_date: parseReleaseDate(lookup["first-release-date"]),
        cover_url: coverUrl,
      },
      { onConflict: "mbid" },
    )
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (artists.length) {
    const { error: creditError } = await admin.from("release_artists").upsert(
      artists.map(({ artist, credit, position }) => ({
        release_id: release.id,
        artist_id: artist.id,
        credit_name: credit.name,
        position,
      })),
      { onConflict: "release_id,artist_id" },
    );

    if (creditError) {
      throw new Error(creditError.message);
    }
  }

  return release;
}

export async function ingestRecording(mbid: string) {
  const lookup = await lookupRecording(mbid);
  return upsertLookedUpRecording(lookup);
}

async function upsertLookedUpRecording(lookup: MusicBrainzRecording) {
  const admin = createAdminClient();
  await upsertArtistsFromCredits(lookup["artist-credit"]);

  const { data, error } = await admin
    .from("recordings")
    .upsert(
      {
        mbid: lookup.id,
        title: lookup.title,
        isrc: lookup.isrcs?.[0] ?? null,
        ...(lookup.length != null ? { length_ms: lookup.length } : {}),
      },
      { onConflict: "mbid" },
    )
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export function formatArtistCredit(
  credits?: MusicBrainzArtistCredit[] | MusicBrainzReleaseGroup["artist-credit"],
) {
  return creditName(credits);
}

export function flattenReleaseTracks(release: MusicBrainzRelease) {
  return (release.media ?? []).flatMap((medium) => medium.tracks ?? []);
}

export function pickCanonicalRelease(releases: MusicBrainzRelease[]) {
  if (!releases.length) {
    return null;
  }

  return [...releases].sort((left, right) => {
    const leftComplete = flattenReleaseTracks(left).filter(
      (track) => track.length || track.recording?.length,
    ).length;
    const rightComplete = flattenReleaseTracks(right).filter(
      (track) => track.length || track.recording?.length,
    ).length;
    if (rightComplete !== leftComplete) {
      return rightComplete - leftComplete;
    }

    return (left.date ?? "9999").localeCompare(right.date ?? "9999");
  })[0];
}

export async function enrichCanonicalRelease(releaseId: string) {
  const admin = createAdminClient();
  const { data: release, error } = await admin
    .from("releases")
    .select("id, mbid, enriched_at")
    .eq("id", releaseId)
    .single();

  if (error || !release || release.enriched_at) {
    return;
  }

  const official = await browseReleases(release.mbid, "official");
  const canonical = pickCanonicalRelease(official);

  if (!canonical) {
    await admin
      .from("releases")
      .update({ enriched_at: new Date().toISOString() })
      .eq("id", releaseId);
    return;
  }

  const tracks = flattenReleaseTracks(canonical);
  const seen = new Set<string>();
  const rows: Array<{
    recording: MusicBrainzRecording;
    position: number;
    creditName: string | null;
    lengthMs: number | null;
  }> = [];

  for (const track of tracks) {
    const recording = track.recording;
    if (!recording?.id || seen.has(recording.id)) {
      continue;
    }

    seen.add(recording.id);
    const lengthMs = track.length ?? recording.length ?? null;
    rows.push({
      recording,
      position: rows.length,
      creditName: creditName(track.recording?.["artist-credit"] ?? recording["artist-credit"]),
      lengthMs,
    });
  }

  for (const row of rows) {
    await upsertLookedUpRecording({
      ...row.recording,
      length: row.lengthMs ?? row.recording.length,
    });
  }

  const recordingIds = new Map<string, string>();
  if (rows.length) {
    const { data: stored } = await admin
      .from("recordings")
      .select("id, mbid")
      .in(
        "mbid",
        rows.map((row) => row.recording.id),
      );

    for (const storedRow of stored ?? []) {
      recordingIds.set(storedRow.mbid, storedRow.id);
    }
  }

  if (recordingIds.size) {
    const { error: trackError } = await admin.from("release_tracks").upsert(
      rows.flatMap((row) => {
        const recordingId = recordingIds.get(row.recording.id);
        if (!recordingId) {
          return [];
        }

        return [
          {
            release_id: releaseId,
            recording_id: recordingId,
            position: row.position,
            credit_name: row.creditName,
          },
        ];
      }),
      { onConflict: "release_id,recording_id" },
    );

    if (trackError) {
      throw new Error(trackError.message);
    }
  }

  const durationMs = rows.reduce((sum, row) => sum + (row.lengthMs ?? 0), 0);
  const labelName =
    canonical["label-info"]?.map((info) => info.label?.name).find((name) => Boolean(name)) ??
    null;

  const { error: updateError } = await admin
    .from("releases")
    .update({
      label_name: labelName,
      duration_ms: durationMs || null,
      canonical_release_mbid: canonical.id,
      enriched_at: new Date().toISOString(),
    })
    .eq("id", releaseId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

export async function ingestEntity(type: CollectionKind, mbid: string) {
  if (type === "album") {
    return { type, row: await ingestReleaseGroup(mbid) };
  }

  if (type === "artist") {
    return { type, row: await ingestArtist(mbid) };
  }

  return { type, row: await ingestRecording(mbid) };
}

function hasStoredImages(images: unknown) {
  return Array.isArray(images) && images.length > 0;
}

export async function ensureArtistDossier(artistId: string) {
  const admin = createAdminClient();
  const { data: artist, error } = await admin
    .from("artists")
    .select("id, mbid, urls, bio, images")
    .eq("id", artistId)
    .single();

  if (error || !artist) {
    return;
  }

  const urls = urlsRecord(artist.urls);
  const hasWikipedia = Boolean(urls.wikipedia);
  const longBio = Boolean(artist.bio && artist.bio.length >= 80);

  if (
    !isEmptyUrls(artist.urls) &&
    hasWikipedia &&
    longBio &&
    hasStoredImages(artist.images)
  ) {
    return;
  }

  await ingestArtist(artist.mbid);
}

export async function ensureReleaseDossier(releaseId: string) {
  const admin = createAdminClient();
  const { data: release, error } = await admin
    .from("releases")
    .select("id, mbid, cover_url, enriched_at")
    .eq("id", releaseId)
    .single();

  if (error || !release) {
    return;
  }

  const { count } = await admin
    .from("release_artists")
    .select("artist_id", { count: "exact", head: true })
    .eq("release_id", releaseId);

  if ((count ?? 0) === 0) {
    await ingestReleaseGroup(release.mbid);
    return;
  }

  if (!release.cover_url) {
    const coverUrl = await findCoverArtUrl(release.mbid);
    if (coverUrl) {
      await admin.from("releases").update({ cover_url: coverUrl }).eq("id", releaseId);
    }
  }

  if (!release.enriched_at) {
    await enrichCanonicalRelease(releaseId);
  }
}
