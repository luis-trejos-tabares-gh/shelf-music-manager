import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: playlist } = await supabase
    .from("playlists")
    .select("id, name, description")
    .eq("id", id)
    .single();

  if (!playlist) {
    notFound();
  }

  const { data: tracks } = await supabase
    .from("playlist_tracks")
    .select("id, position, recordings(id, title)")
    .eq("playlist_id", id)
    .order("position");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
      <p className="text-sm text-zinc-500">
        <Link href="/playlists" className="underline">
          Playlists
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{playlist.name}</h1>
      {playlist.description ? (
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {playlist.description}
        </p>
      ) : null}

      <ol className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        {(tracks ?? []).length === 0 ? (
          <li className="py-4 text-sm text-zinc-600 dark:text-zinc-400">
            Empty.{" "}
            <Link href="/search?type=recording" className="underline">
              Search songs
            </Link>{" "}
            to add tracks.
          </li>
        ) : (
          (tracks ?? []).map((track) => (
            <li key={track.id} className="py-3 text-sm">
              {track.position + 1}.{" "}
              {track.recordings?.id ? (
                <Link href={`/recordings/${track.recordings.id}`} className="underline">
                  {track.recordings.title}
                </Link>
              ) : (
                (track.recordings?.title ?? "Untitled")
              )}
            </li>
          ))
        )}
      </ol>
    </main>
  );
}
