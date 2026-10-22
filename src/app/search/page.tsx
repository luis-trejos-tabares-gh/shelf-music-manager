import {
  searchArtists,
  searchRecordings,
  searchReleaseGroups,
} from "@/lib/musicbrainz/client";
import {
  buildRecordingQuery,
  buildReleaseGroupQuery,
} from "@/lib/musicbrainz/query";
import { coverArtFrontUrl, coverArtReleaseFrontUrl } from "@/lib/coverart/client";
import { formatArtistCredit } from "@/lib/catalog/ingest";
import type { CollectionKind } from "@/lib/catalog/types";
import {
  enrichArtistSearchHits,
  loadSearchMemberships,
} from "@/app/actions/search";
import { SearchResultList } from "@/components/search-result-list";
import type { SearchHit } from "@/components/search-result-row";
import { PendingButton } from "@/components/pending-button";
import { createClient } from "@/lib/supabase/server";

const types: Array<{ value: CollectionKind; label: string }> = [
  { value: "artist", label: "Artists" },
  { value: "album", label: "Albums" },
  { value: "recording", label: "Songs" },
];

function isSearchType(value: string | undefined): value is CollectionKind {
  return value === "album" || value === "artist" || value === "recording";
}

function searchHref(params: {
  q?: string;
  type: CollectionKind;
  artist?: string;
  year?: string;
  album?: string;
}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  search.set("type", params.type);
  if (params.type !== "artist") {
    if (params.artist) search.set("artist", params.artist);
    if (params.year) search.set("year", params.year);
  }
  if (params.type === "recording" && params.album) {
    search.set("album", params.album);
  }
  return `/search?${search.toString()}`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    artist?: string;
    year?: string;
    album?: string;
  }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const artist = params.artist?.trim() ?? "";
  const year = params.year?.trim() ?? "";
  const album = params.album?.trim() ?? "";
  const type = isSearchType(params.type) ? params.type : "artist";
  const returnTo = searchHref({ q: query, type, artist, year, album });
  const lucene =
    type === "album"
      ? buildReleaseGroupQuery({ q: query, artist, year })
      : type === "recording"
        ? buildRecordingQuery({ q: query, artist, year, album })
        : query;
  const hasQuery = Boolean(lucene);

  const supabase = await createClient();
  const [{ data: collections }, { data: playlists }] = await Promise.all([
    supabase
      .from("collections")
      .select("id, name, kind")
      .eq("kind", type)
      .order("name"),
    type === "recording"
      ? supabase.from("playlists").select("id, name").order("name")
      : Promise.resolve({ data: [] }),
  ]);

  let results: SearchHit[] = [];
  let searchError: string | null = null;

  if (hasQuery) {
    try {
      if (type === "album") {
        const data = await searchReleaseGroups(lucene);
        const groups = data["release-groups"] ?? [];
        const memberships = await loadSearchMemberships(
          "album",
          groups.map((item) => item.id),
        );
        results = groups.map((item) => ({
          mbid: item.id,
          title: item.title,
          subtitle: formatArtistCredit(item["artist-credit"]),
          year: item["first-release-date"]?.slice(0, 4) ?? null,
          coverUrl: coverArtFrontUrl(item.id),
          inCollections: memberships.get(item.id) ?? [],
        }));
      } else if (type === "artist") {
        const data = await searchArtists(lucene);
        const artists = data.artists ?? [];
        const previews = await enrichArtistSearchHits(
          artists.map((item) => ({
            mbid: item.id,
            name: item.name,
            disambiguation: item.disambiguation,
          })),
        );
        results = artists.map((item) => {
          const preview = previews.get(item.id);
          return {
            mbid: item.id,
            title: item.name,
            subtitle: item.disambiguation,
            coverUrl: preview?.coverUrl ?? null,
            bio: preview?.bio ?? null,
            inCollections: preview?.inCollections ?? [],
          };
        });
      } else {
        const data = await searchRecordings(lucene);
        const recordings = data.recordings ?? [];
        const memberships = await loadSearchMemberships(
          "recording",
          recordings.map((item) => item.id),
        );
        results = recordings.map((item) => {
          const firstRelease = item.releases?.[0];
          const releaseGroupId = firstRelease?.["release-group"]?.id;
          return {
            mbid: item.id,
            title: item.title,
            subtitle: formatArtistCredit(item["artist-credit"]),
            year: firstRelease?.date?.slice(0, 4) ?? null,
            album: firstRelease?.title ?? null,
            coverUrl: releaseGroupId
              ? coverArtFrontUrl(releaseGroupId)
              : firstRelease
                ? coverArtReleaseFrontUrl(firstRelease.id)
                : null,
            inCollections: memberships.get(item.id) ?? [],
          };
        });
      }
    } catch (error) {
      searchError = error instanceof Error ? error.message : "Search failed";
    }
  }

  return (
    <main className="shelf-fade-up mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        MusicBrainz results. Add to a matching shelf
        {type === "recording" ? " or a playlist" : ""}.
      </p>

      <form className="mt-6 flex flex-col gap-3" action="/search">
        <input type="hidden" name="type" value={type} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={
              type === "album"
                ? "Kind of Blue"
                : type === "artist"
                  ? "Miles Davis"
                  : "So What"
            }
            className="flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
          />
          <PendingButton
            pendingLabel="Searching…"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Search
          </PendingButton>
        </div>
        {type !== "artist" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="search"
              name="artist"
              defaultValue={artist}
              placeholder="Artist (optional)"
              className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
            />
            <input
              type="text"
              name="year"
              inputMode="numeric"
              maxLength={4}
              defaultValue={year}
              placeholder="Year (optional)"
              className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
            />
            {type === "recording" ? (
              <input
                type="search"
                name="album"
                defaultValue={album}
                placeholder="Album (optional)"
                className="sm:col-span-2 rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
              />
            ) : null}
          </div>
        ) : null}
      </form>

      <div className="mt-4 flex gap-2 text-sm">
        {types.map((option) => (
          <a
            key={option.value}
            href={searchHref({
              q: query,
              type: option.value,
              artist,
              year,
              album,
            })}
            className={
              option.value === type
                ? "rounded-full bg-zinc-900 px-3 py-1 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "rounded-full border border-zinc-300 px-3 py-1 dark:border-zinc-700"
            }
          >
            {option.label}
          </a>
        ))}
      </div>

      <ul className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        {searchError ? (
          <li className="py-4 text-sm text-red-700 dark:text-red-300">
            {searchError}
          </li>
        ) : !hasQuery ? (
          <li className="py-4 text-sm text-zinc-600 dark:text-zinc-400">
            Search to see MusicBrainz matches.
          </li>
        ) : results.length === 0 ? (
          <li className="py-4 text-sm text-zinc-600 dark:text-zinc-400">
            No results.
          </li>
        ) : (
          <SearchResultList
            results={results}
            type={type}
            returnTo={returnTo}
            collections={collections ?? []}
            playlists={playlists ?? []}
          />
        )}
      </ul>
    </main>
  );
}
