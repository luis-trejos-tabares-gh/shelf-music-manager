import Link from "next/link";
import { notFound } from "next/navigation";
import { ShelfChip } from "@/components/shelf-chip";
import { ensureReleaseDossier } from "@/lib/catalog/ingest";
import { formatDuration } from "@/lib/catalog/media";
import { createClient } from "@/lib/supabase/server";

export default async function ReleasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await ensureReleaseDossier(id);

  const supabase = await createClient();
  const { data: release } = await supabase
    .from("releases")
    .select("id, title, type, secondary_types, release_date, cover_url, label_name, duration_ms")
    .eq("id", id)
    .single();

  if (!release) {
    notFound();
  }

  const [{ data: credits }, { data: memberships }, { data: tracks }] =
    await Promise.all([
      supabase
        .from("release_artists")
        .select("credit_name, position, artists(id, name)")
        .eq("release_id", id)
        .order("position"),
      supabase
        .from("collection_items")
        .select("id, collections(id, name)")
        .eq("release_id", id),
      supabase
        .from("release_tracks")
        .select("position, credit_name, recordings(id, title, length_ms)")
        .eq("release_id", id)
        .order("position"),
    ]);

  const collections = (memberships ?? []).flatMap((row) =>
    row.collections
      ? [{ id: row.collections.id, name: row.collections.name, itemId: row.id }]
      : [],
  );
  const returnTo = `/releases/${id}`;
  const albumCredit = (credits ?? [])
    .map((credit) => credit.credit_name || credit.artists?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
      <p className="text-sm text-zinc-500">Album</p>
      <div className="mt-2 flex items-start gap-4">
        {release.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={release.cover_url}
            alt={release.title}
            className="h-28 w-28 rounded-md object-cover"
          />
        ) : null}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{release.title}</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {[
              release.type,
              ...(release.secondary_types ?? []),
              release.release_date?.slice(0, 4),
              formatDuration(release.duration_ms),
              release.label_name,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Artists
        </h2>
        <ul className="mt-3 flex flex-wrap gap-3 text-sm">
          {(credits ?? []).length === 0 ? (
            <li className="text-zinc-600 dark:text-zinc-400">No credits stored.</li>
          ) : (
            (credits ?? []).map((credit) =>
              credit.artists ? (
                <li key={credit.artists.id}>
                  <Link href={`/artists/${credit.artists.id}`} className="underline">
                    {credit.credit_name || credit.artists.name}
                  </Link>
                </li>
              ) : null,
            )
          )}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          On your shelves
        </h2>
        <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
          {collections.length === 0 ? (
            <li className="py-3 text-sm text-zinc-600 dark:text-zinc-400">
              Not on an album shelf yet.
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

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Tracks
        </h2>
        {(tracks ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            No tracklist stored yet.
          </p>
        ) : (
          <ol className="mt-3 list-decimal space-y-1 pl-5">
            {(tracks ?? []).map((track) => {
              const title = track.recordings?.title ?? "Untitled";
              const duration = formatDuration(track.recordings?.length_ms);
              const credit =
                track.credit_name && track.credit_name !== albumCredit
                  ? track.credit_name
                  : null;

              return (
                <li key={track.recordings?.id ?? track.position} className="text-sm">
                  {track.recordings?.id ? (
                    <Link href={`/recordings/${track.recordings.id}`} className="underline">
                      {title}
                    </Link>
                  ) : (
                    title
                  )}
                  {duration ? ` · ${duration}` : ""}
                  {credit ? ` · ${credit}` : ""}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </main>
  );
}
