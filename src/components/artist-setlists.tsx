"use client";

import { useState } from "react";
import { loadArtistSetlists } from "@/app/actions/discography";
import type { SetlistShow } from "@/lib/setlistfm/client";

export function ArtistSetlists({
  artistId,
  mbid,
  count,
}: {
  artistId: string;
  mbid: string;
  count: number;
}) {
  const [open, setOpen] = useState(false);
  const [shows, setShows] = useState<SetlistShow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (!next || shows.length || loading) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setShows(await loadArtistSetlists(artistId, mbid));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load setlists");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10">
      <button
        type="button"
        onClick={() => {
          void toggle();
        }}
        className="text-left text-sm font-semibold uppercase tracking-wide text-zinc-500"
      >
        Recent shows ({count})
      </button>
      {open ? (
        <>
          {loading ? (
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-zinc-500">
              <span className="shelf-spinner" />
              Loading shows…
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>
          ) : null}
          <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
            {shows.map((show) => (
              <li key={show.id} className="py-3 text-sm">
                <p className="font-medium">
                  {show.url ? (
                    <a href={show.url} className="underline" target="_blank" rel="noreferrer">
                      {show.venue ?? "Show"}
                    </a>
                  ) : (
                    (show.venue ?? "Show")
                  )}
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {[show.eventDate, show.city, show.tour].filter(Boolean).join(" · ")}
                </p>
                {show.songs.length ? (
                  <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-zinc-500">
                    {show.songs.map((song, index) => (
                      <li key={`${show.id}-${index}`}>{song}</li>
                    ))}
                  </ol>
                ) : null}
              </li>
            ))}
          </ul>
          {shows.length ? (
            <p className="mt-3 text-xs text-zinc-500">
              Data from{" "}
              <a href="https://www.setlist.fm" className="underline" target="_blank" rel="noreferrer">
                setlist.fm
              </a>
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
