import Link from "next/link";
import { notFound } from "next/navigation";
import { removeFromLibrary } from "@/app/actions/catalog";
import { deleteCollection } from "@/app/actions/library";
import { PendingButton } from "@/components/pending-button";
import { firstImageUrl } from "@/lib/catalog/media";
import { createClient } from "@/lib/supabase/server";

export default async function ShelfDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: collection } = await supabase
    .from("collections")
    .select("id, name, kind")
    .eq("id", id)
    .single();

  if (!collection) {
    notFound();
  }

  const { data: items } = await supabase
    .from("collection_items")
    .select(
      "id, notes, releases(id, title, cover_url), artists(id, name, images), recordings(id, title)",
    )
    .eq("collection_id", id)
    .order("position");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
      <p className="text-sm text-zinc-500">
        <Link href="/shelves" className="underline">
          Shelves
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{collection.name}</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {collection.kind} shelf
      </p>

      <ul className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        {(items ?? []).length === 0 ? (
          <li className="flex flex-wrap items-center gap-3 py-4 text-sm text-zinc-600 dark:text-zinc-400">
            <span>
              Empty.{" "}
              <Link href={`/search?type=${collection.kind}`} className="underline">
                Search
              </Link>{" "}
              to add something.
            </span>
            <form action={deleteCollection}>
              <input type="hidden" name="collection_id" value={collection.id} />
              <input type="hidden" name="return_to" value={`/shelves/${id}`} />
              <PendingButton
                pendingLabel="Removing…"
                className="text-zinc-500 underline disabled:opacity-60"
              >
                Remove shelf
              </PendingButton>
            </form>
          </li>
        ) : (
          (items ?? []).map((item) => {
            const href = item.releases?.id
              ? `/releases/${item.releases.id}`
              : item.artists?.id
                ? `/artists/${item.artists.id}`
                : item.recordings?.id
                  ? `/recordings/${item.recordings.id}`
                  : null;
            const title =
              item.releases?.title ??
              item.artists?.name ??
              item.recordings?.title ??
              "Untitled";
            const imageUrl =
              item.releases?.cover_url ?? firstImageUrl(item.artists?.images);

            return (
              <li key={item.id} className="flex items-center gap-3 py-3 text-sm">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt=""
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : null}
                <span className="min-w-0 flex-1">
                  {href ? (
                    <Link href={href} className="underline">
                      {title}
                    </Link>
                  ) : (
                    title
                  )}
                </span>
                <form action={removeFromLibrary}>
                  <input type="hidden" name="item_id" value={item.id} />
                  <input type="hidden" name="return_to" value={`/shelves/${id}`} />
                  <PendingButton
                    pendingLabel="Removing…"
                    className="text-zinc-500 underline disabled:opacity-60"
                  >
                    Remove
                  </PendingButton>
                </form>
              </li>
            );
          })
        )}
      </ul>
    </main>
  );
}
