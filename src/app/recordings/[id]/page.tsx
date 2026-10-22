import Link from "next/link";
import { notFound } from "next/navigation";
import { ShelfChip } from "@/components/shelf-chip";
import { createClient } from "@/lib/supabase/server";

export default async function RecordingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: recording } = await supabase
    .from("recordings")
    .select("id, title, isrc")
    .eq("id", id)
    .single();

  if (!recording) {
    notFound();
  }

  const [{ data: playlistRows }, { data: collectionRows }, { data: trackRows }] =
    await Promise.all([
      supabase
        .from("playlist_tracks")
        .select("playlists(id, name)")
        .eq("recording_id", id),
      supabase
        .from("collection_items")
        .select("id, collections(id, name)")
        .eq("recording_id", id),
      supabase
        .from("release_tracks")
        .select("releases(id, title, release_artists(artists(id, name)))")
        .eq("recording_id", id),
    ]);

  const playlists = (playlistRows ?? [])
    .map((row) => row.playlists)
    .filter((playlist): playlist is NonNullable<typeof playlist> => Boolean(playlist));
  const collections = (collectionRows ?? []).flatMap((row) =>
    row.collections
      ? [{ id: row.collections.id, name: row.collections.name, itemId: row.id }]
      : [],
  );

  const artists = new Map<string, string>();
  for (const row of trackRows ?? []) {
    for (const credit of row.releases?.release_artists ?? []) {
      if (credit.artists) {
        artists.set(credit.artists.id, credit.artists.name);
      }
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
      <p className="text-sm text-zinc-500">Song</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{recording.title}</h1>
      {recording.isrc ? (
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          ISRC {recording.isrc}
        </p>
      ) : null}

      {artists.size ? (
        <ul className="mt-6 flex flex-wrap gap-3 text-sm">
          {[...artists.entries()].map(([artistId, name]) => (
            <li key={artistId}>
              <Link href={`/artists/${artistId}`} className="underline">
                {name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Playlists
        </h2>
        <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
          {playlists.length === 0 ? (
            <li className="py-3 text-sm text-zinc-600 dark:text-zinc-400">
              Not on a playlist yet.
            </li>
          ) : (
            playlists.map((playlist) => (
              <li key={playlist.id} className="py-3 text-sm">
                <Link href={`/playlists/${playlist.id}`} className="underline">
                  {playlist.name}
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Song shelves
        </h2>
        <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
          {collections.length === 0 ? (
            <li className="py-3 text-sm text-zinc-600 dark:text-zinc-400">
              Not on a song shelf yet.
            </li>
          ) : (
            collections.map((collection) => (
              <li key={collection.itemId} className="py-3 text-sm">
                <ShelfChip
                  collectionId={collection.id}
                  name={collection.name}
                  itemId={collection.itemId}
                  returnTo={`/recordings/${recording.id}`}
                />
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
