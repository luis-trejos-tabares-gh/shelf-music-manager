import "server-only";
import { getMusicBrainzUserAgent } from "@/lib/env.server";

const MUSICBRAINZ_API = "https://musicbrainz.org/ws/2";

// MusicBrainz asks for at most ~1 request per second for anonymous use.
// Callers should space requests; this client does not queue them.

export type MusicBrainzSearchHit = {
  id: string;
  score?: number;
};

export type MusicBrainzArtist = MusicBrainzSearchHit & {
  name: string;
  "sort-name"?: string;
  disambiguation?: string;
  country?: string;
  type?: string;
};

export type MusicBrainzReleaseGroup = MusicBrainzSearchHit & {
  title: string;
  "primary-type"?: string;
  "first-release-date"?: string;
  "artist-credit"?: Array<{ name: string; artist?: { id: string; name: string } }>;
};

export type MusicBrainzRecording = MusicBrainzSearchHit & {
  title: string;
  length?: number;
  isrcs?: string[];
  "artist-credit"?: Array<{ name: string; artist?: { id: string; name: string } }>;
};

type SearchResponse<K extends string, T> = {
  created?: string;
  count: number;
  offset: number;
} & Record<K, T[]>;

async function musicBrainzFetch<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const MUSICBRAINZ_USER_AGENT = getMusicBrainzUserAgent();
  const url = new URL(`${MUSICBRAINZ_API}${path}`);
  url.searchParams.set("fmt", "json");

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": MUSICBRAINZ_USER_AGENT,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`MusicBrainz ${response.status}: ${body}`);
  }

  return (await response.json()) as T;
}

export function searchArtists(query: string, limit = 10) {
  return musicBrainzFetch<SearchResponse<"artists", MusicBrainzArtist>>(
    "/artist",
    { query, limit: String(limit) },
  );
}

export function searchReleaseGroups(query: string, limit = 10) {
  return musicBrainzFetch<
    SearchResponse<"release-groups", MusicBrainzReleaseGroup>
  >("/release-group", { query, limit: String(limit) });
}

export function searchRecordings(query: string, limit = 10) {
  return musicBrainzFetch<SearchResponse<"recordings", MusicBrainzRecording>>(
    "/recording",
    { query, limit: String(limit) },
  );
}

export function lookupArtist(mbid: string) {
  return musicBrainzFetch<MusicBrainzArtist>(`/artist/${mbid}`, {
    inc: "url-rels+annotation",
  });
}

export function lookupReleaseGroup(mbid: string) {
  return musicBrainzFetch<MusicBrainzReleaseGroup>(`/release-group/${mbid}`, {
    inc: "artist-credits+url-rels",
  });
}

export function lookupRecording(mbid: string) {
  return musicBrainzFetch<MusicBrainzRecording>(`/recording/${mbid}`, {
    inc: "artist-credits+isrcs",
  });
}
