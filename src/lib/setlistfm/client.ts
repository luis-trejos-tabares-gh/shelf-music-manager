import "server-only";
import { getSetlistFmApiKey } from "@/lib/env.server";
import { httpsGet } from "@/lib/http";

export type SetlistShow = {
  id: string;
  eventDate: string | null;
  venue: string | null;
  city: string | null;
  tour: string | null;
  url: string | null;
  songs: string[];
};

type SetlistFmSong = { name?: string };
type SetlistFmSet = { song?: SetlistFmSong[] };
type SetlistFmSetlist = {
  id?: string;
  eventDate?: string;
  url?: string;
  venue?: {
    name?: string;
    city?: { name?: string; country?: { name?: string } };
  };
  tour?: { name?: string };
  sets?: { set?: SetlistFmSet[] };
  set?: SetlistFmSet[];
};

export async function fetchArtistSetlists(mbid: string, limit = 10) {
  const apiKey = getSetlistFmApiKey();
  if (!apiKey) {
    return null;
  }

  const url = new URL(`https://api.setlist.fm/rest/1.0/artist/${mbid}/setlists`);
  url.searchParams.set("p", "1");

  const response = await httpsGet(url, {
    Accept: "application/json",
    "x-api-key": apiKey,
  });

  if (response.status === 404) {
    return [];
  }

  if (response.status >= 400) {
    throw new Error(`Setlist.fm ${response.status}: ${response.body}`);
  }

  const payload = JSON.parse(response.body) as {
    setlist?: SetlistFmSetlist[];
  };

  return (payload.setlist ?? []).slice(0, limit).map(normalizeSetlist);
}

function normalizeSetlist(setlist: SetlistFmSetlist): SetlistShow {
  const city = setlist.venue?.city;
  const cityLabel = [city?.name, city?.country?.name].filter(Boolean).join(", ");
  const sets = setlist.sets?.set ?? setlist.set ?? [];
  const songs = sets.flatMap((set) =>
    (set.song ?? []).map((song) => song.name).filter((name): name is string => Boolean(name)),
  );

  return {
    id: setlist.id ?? crypto.randomUUID(),
    eventDate: setlist.eventDate ?? null,
    venue: setlist.venue?.name ?? null,
    city: cityLabel || null,
    tour: setlist.tour?.name ?? null,
    url: setlist.url ?? null,
    songs,
  };
}
