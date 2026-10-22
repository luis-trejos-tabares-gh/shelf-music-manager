import "server-only";
import { getMusicBrainzUserAgent } from "@/lib/env.server";
import { httpsGet } from "@/lib/http";

const MUSICBRAINZ_API = "https://musicbrainz.org/ws/2";
const MIN_GAP_MS = 1100;

let nextAllowedAt = 0;
let queue: Promise<void> = Promise.resolve();

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function throttle() {
  const run = queue.then(async () => {
    const waitMs = nextAllowedAt - Date.now();
    if (waitMs > 0) {
      await wait(waitMs);
    }
    nextAllowedAt = Date.now() + MIN_GAP_MS;
  });
  queue = run.catch(() => undefined);
  await run;
}

export type MusicBrainzSearchHit = {
  id: string;
  score?: number;
};

export type MusicBrainzRelation = {
  type?: string;
  url?: { resource?: string };
};

export type MusicBrainzArtistCredit = {
  name: string;
  joinphrase?: string;
  artist?: { id: string; name: string };
};

export type MusicBrainzArtist = MusicBrainzSearchHit & {
  name: string;
  "sort-name"?: string;
  disambiguation?: string;
  country?: string;
  type?: string;
  annotation?: string | { text?: string };
  relations?: MusicBrainzRelation[];
};

export type MusicBrainzReleaseGroup = MusicBrainzSearchHit & {
  title: string;
  "primary-type"?: string | null;
  "secondary-types"?: string[];
  "first-release-date"?: string;
  "artist-credit"?: MusicBrainzArtistCredit[];
  relations?: MusicBrainzRelation[];
};

export type MusicBrainzRecordingRelease = {
  id: string;
  title: string;
  date?: string;
  "release-group"?: { id: string };
};

export type MusicBrainzRecording = MusicBrainzSearchHit & {
  title: string;
  length?: number;
  isrcs?: string[];
  "artist-credit"?: MusicBrainzArtistCredit[];
  releases?: MusicBrainzRecordingRelease[];
};

export type MusicBrainzTrack = {
  id?: string;
  position?: number;
  number?: string;
  title?: string;
  length?: number;
  recording?: MusicBrainzRecording;
};

export type MusicBrainzMedium = {
  position?: number;
  format?: string;
  tracks?: MusicBrainzTrack[];
};

export type MusicBrainzRelease = MusicBrainzSearchHit & {
  title: string;
  date?: string;
  status?: string;
  country?: string;
  "artist-credit"?: MusicBrainzArtistCredit[];
  "label-info"?: Array<{ label?: { id?: string; name?: string } }>;
  media?: MusicBrainzMedium[];
};

type SearchResponse<K extends string, T> = {
  created?: string;
  count: number;
  offset: number;
} & Record<K, T[]>;

type BrowseResponse<CountKey extends string, OffsetKey extends string, ListKey extends string, T> = {
  [K in CountKey | OffsetKey]: number;
} & Record<ListKey, T[]>;

async function musicBrainzFetch<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  await throttle();

  const MUSICBRAINZ_USER_AGENT = getMusicBrainzUserAgent();
  const url = new URL(`${MUSICBRAINZ_API}${path}`);
  url.searchParams.set("fmt", "json");

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const headers = {
    Accept: "application/json",
    "User-Agent": MUSICBRAINZ_USER_AGENT,
  };

  let lastError = "MusicBrainz request failed";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await httpsGet(url, headers);

      if (response.status >= 200 && response.status < 300) {
        return JSON.parse(response.body) as T;
      }

      lastError = `MusicBrainz ${response.status}: ${response.body}`;

      if (response.status !== 503 || attempt === 2) {
        throw new Error(lastError);
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      const retryable =
        lastError.includes("MusicBrainz 503") ||
        lastError.includes("ECONNRESET") ||
        lastError.includes("socket disconnected") ||
        lastError.includes("ETIMEDOUT");
      if (attempt === 2 || !retryable) {
        throw error instanceof Error ? error : new Error(lastError);
      }
    }

    await wait(1100);
  }

  throw new Error(lastError);
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

export function lookupRecording(
  mbid: string,
  inc = "artist-credits+isrcs",
) {
  return musicBrainzFetch<MusicBrainzRecording>(`/recording/${mbid}`, {
    inc,
  });
}

export async function browseReleaseGroupsPage(
  artistMbid: string,
  offset = 0,
  limit = 100,
) {
  const page = await musicBrainzFetch<
    BrowseResponse<
      "release-group-count",
      "release-group-offset",
      "release-groups",
      MusicBrainzReleaseGroup
    >
  >("/release-group", {
    artist: artistMbid,
    inc: "artist-credits",
    limit: String(limit),
    offset: String(offset),
  });

  return {
    groups: page["release-groups"] ?? [],
    count: page["release-group-count"] ?? 0,
    offset: page["release-group-offset"] ?? offset,
  };
}

export async function browseReleaseGroups(artistMbid: string) {
  const groups: MusicBrainzReleaseGroup[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const page = await browseReleaseGroupsPage(artistMbid, offset, limit);
    groups.push(...page.groups);
    offset += page.groups.length;

    if (page.groups.length < limit || offset >= page.count) {
      break;
    }
  }

  return groups;
}

export async function browseReleases(releaseGroupMbid: string, status?: "official") {
  const params: Record<string, string> = {
    "release-group": releaseGroupMbid,
    inc: "recordings+artist-credits+labels",
    limit: "25",
  };

  if (status) {
    params.status = status;
  }

  const page = await musicBrainzFetch<
    BrowseResponse<"release-count", "release-offset", "releases", MusicBrainzRelease>
  >("/release", params);

  return page.releases ?? [];
}
