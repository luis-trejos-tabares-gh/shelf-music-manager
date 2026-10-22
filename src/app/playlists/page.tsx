import Link from "next/link";
import { createPlaylist } from "@/app/actions/library";
import { PendingButton } from "@/components/pending-button";
import { createClient } from "@/lib/supabase/server";

export default async function PlaylistsPage() {
  const supabase = await createClient();
  const { data: playlists } = await supabase
    .from("playlists")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Playlists</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Ordered song lists. Spotify sync comes later.
      </p>

      <form action={createPlaylist} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          name="name"
          required
          placeholder="Sunday morning"
          className="flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
        />
        <PendingButton
          pendingLabel="Creating…"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Create
        </PendingButton>
      </form>

      <ul className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        {(playlists ?? []).length === 0 ? (
          <li className="py-4 text-sm text-zinc-600 dark:text-zinc-400">
            No playlists yet.
          </li>
        ) : (
          (playlists ?? []).map((playlist) => (
            <li key={playlist.id} className="py-3">
              <Link href={`/playlists/${playlist.id}`} className="font-medium underline">
                {playlist.name}
              </Link>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
