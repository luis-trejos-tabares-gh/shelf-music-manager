import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { fetchArtistSetlists, type SetlistShow } from "@/lib/setlistfm/client";
import { getSetlistFmApiKey } from "@/lib/env.server";
import type { Json } from "@/types/database";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function getCachedArtistSetlists(artistId: string, mbid: string) {
  if (!getSetlistFmApiKey()) {
    return null;
  }

  const admin = createAdminClient();
  const { data: cached } = await admin
    .from("artist_setlists")
    .select("payload, fetched_at")
    .eq("artist_id", artistId)
    .maybeSingle();

  if (cached?.fetched_at) {
    const age = Date.now() - new Date(cached.fetched_at).getTime();
    if (age < CACHE_TTL_MS && Array.isArray(cached.payload)) {
      return cached.payload as SetlistShow[];
    }
  }

  try {
    const shows = await fetchArtistSetlists(mbid);
    if (!shows) {
      return null;
    }

    await admin.from("artist_setlists").upsert({
      artist_id: artistId,
      payload: shows as unknown as Json,
      fetched_at: new Date().toISOString(),
    });

    return shows;
  } catch {
    if (Array.isArray(cached?.payload)) {
      return cached.payload as SetlistShow[];
    }

    return [];
  }
}
