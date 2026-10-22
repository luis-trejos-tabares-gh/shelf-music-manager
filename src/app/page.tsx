import Link from "next/link";
import { EmptyShelfArt } from "@/components/empty-shelf-art";
import { LazyCover } from "@/components/lazy-cover";
import { ShelfMark } from "@/components/shelf-mark";
import { firstImageUrl } from "@/lib/catalog/media";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: items } = user
    ? await supabase
        .from("collection_items")
        .select(
          "id, collections(id, name), releases(id, title, cover_url), artists(id, name, images), recordings(id, title)",
        )
        .order("created_at", { ascending: false })
        .limit(8)
    : { data: [] };

  const shelfItems = (items ?? []).flatMap((item) => {
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

    if (!href) {
      return [];
    }

    return [{ id: item.id, href, title, imageUrl, shelf: item.collections?.name }];
  });

  return (
    <main className="shelf-fade-up mx-auto flex w-full max-w-4xl flex-1 flex-col">     
      <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight">
        Your music, your shelves.
      </h1>
      <p className="mt-4 max-w-lg text-zinc-600 dark:text-zinc-400">
        A private collection of your favorite music, we can't play it, but we can help you organize it.
      </p>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        {user ? (
          <>
            <Link
              href="/search"
              className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Search
            </Link>
            <Link
              href="/shelves"
              className="rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-700"
            >
              Shelves
            </Link>
            <Link
              href="/playlists"
              className="rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-700"
            >
              Playlists
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/signup"
              className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Sign up
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-700"
            >
              Sign in
            </Link>
            <Link
              href="/search"
              className="rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-700"
            >
              Search
            </Link>
          </>
        )}
      </div>

      {user ? (
        <section className="mt-14">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            From your shelves
          </h2>
          {shelfItems.length ? (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {shelfItems.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="group block">
                    <div className="aspect-square overflow-hidden rounded-md bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
                      {item.imageUrl ? (
                        <LazyCover
                          src={item.imageUrl}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <p className="mt-2 truncate text-sm font-medium group-hover:underline">
                      {item.title}
                    </p>
                    {item.shelf ? (
                      <p className="truncate text-xs text-zinc-500">{item.shelf}</p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4">
              <EmptyShelfArt />
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                Nothing filed yet.{" "}
                <Link href="/search" className="underline">
                  Search
                </Link>{" "}
                and put a record on a shelf.
              </p>
            </div>
          )}
        </section>
      ) : (
        <div className="mt-14">
          <EmptyShelfArt />
        </div>
      )}
    </main>
  );
}
