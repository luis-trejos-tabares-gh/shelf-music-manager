import Link from "next/link";
import { createCollection, deleteCollection } from "@/app/actions/library";
import { PendingButton } from "@/components/pending-button";
import { createClient } from "@/lib/supabase/server";

export default async function ShelvesPage() {
  const supabase = await createClient();
  const { data: collections } = await supabase
    .from("collections")
    .select("id, name, kind, created_at, collection_items(count)")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Shelves</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Each shelf holds one type: albums, artists, or songs.
      </p>

      <form action={createCollection} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          name="name"
          required
          placeholder="Jazz"
          className="flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
        />
        <select
          name="kind"
          required
          className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
        >
          <option value="album">Albums</option>
          <option value="artist">Artists</option>
          <option value="recording">Songs</option>
        </select>
        <PendingButton
          pendingLabel="Creating…"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Create
        </PendingButton>
      </form>

      <ul className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        {(collections ?? []).length === 0 ? (
          <li className="py-4 text-sm text-zinc-600 dark:text-zinc-400">
            No shelves yet.
          </li>
        ) : (
          (collections ?? []).map((collection) => {
            const itemCount = collection.collection_items?.[0]?.count ?? 0;

            return (
              <li key={collection.id} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <Link href={`/shelves/${collection.id}`} className="font-medium underline">
                    {collection.name}
                  </Link>
                  <span className="ml-2 text-sm text-zinc-500">{collection.kind}</span>
                </span>
                {itemCount === 0 ? (
                  <form action={deleteCollection}>
                    <input type="hidden" name="collection_id" value={collection.id} />
                    <input type="hidden" name="return_to" value="/shelves" />
                    <PendingButton
                      pendingLabel="Removing…"
                      className="text-sm text-zinc-500 underline disabled:opacity-60"
                    >
                      Remove
                    </PendingButton>
                  </form>
                ) : null}
              </li>
            );
          })
        )}
      </ul>
    </main>
  );
}
