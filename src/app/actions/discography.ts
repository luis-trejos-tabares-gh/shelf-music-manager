"use server";

import { redirect } from "next/navigation";
import {
  DISCOGRAPHY_PAGE_SIZE,
  DISCOGRAPHY_SECTIONS,
  type DiscographyBucket,
  type DiscographyRow,
} from "@/lib/catalog/discography-shared";
import { getDiscographySectionPage } from "@/lib/catalog/discography";
import { enrichCanonicalRelease } from "@/lib/catalog/ingest";
import { getCachedArtistSetlists } from "@/lib/catalog/setlists";
import type { SetlistShow } from "@/lib/setlistfm/client";
import { withNotice } from "@/lib/notice";
import { createClient } from "@/lib/supabase/server";

function isDiscographyBucket(value: string): value is DiscographyBucket {
  return DISCOGRAPHY_SECTIONS.some((section) => section.id === value);
}

export async function loadDiscographySection({
  artistId,
  bucket,
  offset = 0,
  limit = DISCOGRAPHY_PAGE_SIZE,
  showHidden = false,
}: {
  artistId: string;
  bucket: DiscographyBucket;
  offset?: number;
  limit?: number;
  showHidden?: boolean;
}): Promise<{ items: DiscographyRow[]; total: number; hasAlbumCollections: boolean }> {
  if (!artistId || !isDiscographyBucket(bucket)) {
    throw new Error("Invalid discography section");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sign in to load discography");
  }

  return getDiscographySectionPage(artistId, bucket, showHidden, offset, limit);
}

export async function loadArtistSetlists(
  artistId: string,
  mbid: string,
): Promise<SetlistShow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sign in to load setlists");
  }

  return (await getCachedArtistSetlists(artistId, mbid)) ?? [];
}

export type AlbumDetailsTrack = {
  id: string | null;
  position: number | null;
  title: string;
  lengthMs: number | null;
  creditName: string | null;
};

export type AlbumDetails = {
  labelName: string | null;
  durationMs: number | null;
  albumCredit: string | null;
  tracks: AlbumDetailsTrack[];
};

export async function loadAlbumDetails(releaseId: string): Promise<AlbumDetails> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sign in to load album details");
  }

  await enrichCanonicalRelease(releaseId);

  const [{ data: release }, { data: credits }, { data: tracks }] = await Promise.all([
    supabase
      .from("releases")
      .select("label_name, duration_ms")
      .eq("id", releaseId)
      .single(),
    supabase
      .from("release_artists")
      .select("credit_name, position, artists(name)")
      .eq("release_id", releaseId)
      .order("position"),
    supabase
      .from("release_tracks")
      .select("position, credit_name, recordings(id, title, length_ms)")
      .eq("release_id", releaseId)
      .order("position"),
  ]);

  const albumCredit =
    (credits ?? [])
      .map((credit) => credit.credit_name || credit.artists?.name)
      .filter(Boolean)
      .join(", ") || null;

  return {
    labelName: release?.label_name ?? null,
    durationMs: release?.duration_ms ?? null,
    albumCredit,
    tracks: (tracks ?? []).map((track) => ({
      id: track.recordings?.id ?? null,
      position: track.position,
      title: track.recordings?.title ?? "Untitled",
      lengthMs: track.recordings?.length_ms ?? null,
      creditName: track.credit_name,
    })),
  };
}

function artistReturnPath(artistId: string, showHidden: boolean) {
  return showHidden ? `/artists/${artistId}?hidden=1` : `/artists/${artistId}`;
}

export async function hideRelease(formData: FormData) {
  const releaseId = String(formData.get("release_id") ?? "").trim();
  const artistId = String(formData.get("artist_id") ?? "").trim();
  const showHidden = String(formData.get("show_hidden") ?? "") === "1";

  if (!releaseId || !artistId) {
    redirect("/search");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("hidden_releases").upsert({
    user_id: user.id,
    release_id: releaseId,
  });

  if (error) {
    redirect(withNotice(`/artists/${artistId}`, "error", error.message));
  }

  redirect(withNotice(artistReturnPath(artistId, showHidden), "added", "Hidden"));
}

export async function unhideRelease(formData: FormData) {
  const releaseId = String(formData.get("release_id") ?? "").trim();
  const artistId = String(formData.get("artist_id") ?? "").trim();
  const showHidden = String(formData.get("show_hidden") ?? "") === "1";

  if (!releaseId || !artistId) {
    redirect("/search");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("hidden_releases")
    .delete()
    .eq("user_id", user.id)
    .eq("release_id", releaseId);

  if (error) {
    redirect(withNotice(`/artists/${artistId}`, "error", error.message));
  }

  redirect(withNotice(artistReturnPath(artistId, showHidden), "added", "Unhidden"));
}
