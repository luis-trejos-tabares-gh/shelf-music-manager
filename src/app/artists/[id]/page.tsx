import Link from "next/link";
import { notFound } from "next/navigation";
import { followArtist, unfollowArtist } from "@/app/actions/library";
import { ArtistSetlists } from "@/components/artist-setlists";
import { DiscographySection } from "@/components/discography-section";
import { ShelfChip } from "@/components/shelf-chip";
import { PendingButton } from "@/components/pending-button";
import {
  DISCOGRAPHY_PAGE_SIZE,
  DISCOGRAPHY_SECTIONS,
  ensureArtistDiscography,
  getArtistDiscography,
} from "@/lib/catalog/discography";
import { ensureArtistDossier } from "@/lib/catalog/ingest";
import { urlLabel } from "@/lib/catalog/labels";
import { firstImageUrl } from "@/lib/catalog/media";
import { getCachedArtistSetlists } from "@/lib/catalog/setlists";
import { urlsRecord } from "@/lib/catalog/urls";
import { createClient } from "@/lib/supabase/server";

export default async function ArtistPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hidden?: string }>;
}) {
  const { id } = await params;
  const { hidden } = await searchParams;
  const showHidden = hidden === "1";

  await ensureArtistDossier(id);
  await ensureArtistDiscography(id);

  const supabase = await createClient();
  const { data: artist } = await supabase
    .from("artists")
    .select("id, mbid, name, bio, urls, images")
    .eq("id", id)
    .single();

  if (!artist) {
    notFound();
  }

  const [{ data: follow }, { data: memberships }, discography] = await Promise.all([
    supabase
      .from("follows")
      .select("artist_id")
      .eq("artist_id", id)
      .maybeSingle(),
    supabase
      .from("collection_items")
      .select("id, collections(id, name)")
      .eq("artist_id", id),
    getArtistDiscography(id, showHidden),
  ]);

  const urls = urlsRecord(artist.urls);
  const photoUrl = firstImageUrl(artist.images);
  const setlists = await getCachedArtistSetlists(artist.id, artist.mbid);
  const collections = (memberships ?? []).flatMap((row) =>
    row.collections
      ? [{ id: row.collections.id, name: row.collections.name, itemId: row.id }]
      : [],
  );
  const returnTo = `/artists/${artist.id}`;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-8">
      <p className="text-sm text-zinc-500">Artist</p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={artist.name}
              className="h-28 w-28 rounded-md object-cover"
            />
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight">{artist.name}</h1>
        </div>
        <form action={follow ? unfollowArtist : followArtist}>
          <input type="hidden" name="artist_id" value={artist.id} />
          <PendingButton
            pendingLabel={follow ? "Unfollowing…" : "Following…"}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-60 dark:border-zinc-700"
          >
            {follow ? "Unfollow" : "Follow"}
          </PendingButton>
        </form>
      </div>

      {artist.bio ? (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          {artist.bio}
        </p>
      ) : null}

      {Object.keys(urls).length ? (
        <ul className="mt-6 flex flex-wrap gap-3 text-sm">
          {Object.entries(urls).map(([key, href]) => (
            <li key={key}>
              <a href={href} className="underline" target="_blank" rel="noreferrer">
                {urlLabel(key)}
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          On your shelves
        </h2>
        <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
          {collections.length === 0 ? (
            <li className="py-3 text-sm text-zinc-600 dark:text-zinc-400">
              Not on an artist shelf yet.
            </li>
          ) : (
            collections.map((collection) => (
              <li key={collection.itemId} className="py-3 text-sm">
                <ShelfChip
                  collectionId={collection.id}
                  name={collection.name}
                  itemId={collection.itemId}
                  returnTo={returnTo}
                />
              </li>
            ))
          )}
        </ul>
      </section>

      {discography.hiddenCount ? (
        <p className="mt-10 text-sm text-zinc-500">
          {showHidden ? (
            <Link href={`/artists/${artist.id}`} className="underline">
              Hide ignored titles
            </Link>
          ) : (
            <Link href={`/artists/${artist.id}?hidden=1`} className="underline">
              Show hidden ({discography.hiddenCount})
            </Link>
          )}
        </p>
      ) : null}

      {DISCOGRAPHY_SECTIONS.map((section) => {
        const items = discography.grouped.get(section.id) ?? [];
        if (!items.length) {
          return null;
        }

        return (
          <DiscographySection
            key={section.id}
            bucket={section.id}
            label={section.label}
            count={items.length}
            defaultOpen={section.id === "albums"}
            initialItems={
              section.id === "albums" ? items.slice(0, DISCOGRAPHY_PAGE_SIZE) : []
            }
            artistId={artist.id}
            returnTo={returnTo}
            showHidden={showHidden}
            hasAlbumCollections={discography.hasAlbumCollections}
          />
        );
      })}

      {discography.totalReleases === 0 ? (
        <p className="mt-10 text-sm text-zinc-600 dark:text-zinc-400">
          No MusicBrainz release groups stored yet.
        </p>
      ) : null}

      {setlists && setlists.length > 0 ? (
        <ArtistSetlists
          artistId={artist.id}
          mbid={artist.mbid}
          count={setlists.length}
        />
      ) : null}
    </main>
  );
}
