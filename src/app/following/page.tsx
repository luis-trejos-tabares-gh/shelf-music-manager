import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function FollowingPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("follows")
    .select("created_at, artists(id, name)")
    .order("created_at", { ascending: false });

  const artists = (rows ?? [])
    .map((row) => row.artists)
    .filter((artist): artist is NonNullable<typeof artist> => Boolean(artist));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Following</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Artists whose dossiers you are watching. Not a like.
      </p>

      <ul className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        {artists.length === 0 ? (
          <li className="py-4 text-sm text-zinc-600 dark:text-zinc-400">
            You are not following anyone yet.
          </li>
        ) : (
          artists.map((artist) => (
            <li key={artist.id} className="py-3 text-sm">
              <Link href={`/artists/${artist.id}`} className="underline">
                {artist.name}
              </Link>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
