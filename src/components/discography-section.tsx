"use client";

import { useState } from "react";
import { loadDiscographySection } from "@/app/actions/discography";
import { DiscographyAlbumRow } from "@/components/discography-album-row";
import {
  DISCOGRAPHY_PAGE_SIZE,
  type DiscographyBucket,
  type DiscographyRow,
} from "@/lib/catalog/discography-shared";

export function DiscographySection({
  bucket,
  label,
  count,
  defaultOpen,
  initialItems,
  artistId,
  returnTo,
  showHidden,
  hasAlbumCollections,
}: {
  bucket: DiscographyBucket;
  label: string;
  count: number;
  defaultOpen: boolean;
  initialItems: DiscographyRow[];
  artistId: string;
  returnTo: string;
  showHidden: boolean;
  hasAlbumCollections: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(count);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadFrom(offset: number) {
    setLoading(true);
    setError(null);
    try {
      const page = await loadDiscographySection({
        artistId,
        bucket,
        offset,
        limit: DISCOGRAPHY_PAGE_SIZE,
        showHidden,
      });
      setTotal(page.total);
      setItems((current) => (offset === 0 ? page.items : [...current, ...page.items]));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load section");
    } finally {
      setLoading(false);
    }
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && items.length === 0 && total > 0) {
      await loadFrom(0);
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
        {label} ({total})
      </button>
      {open ? (
        <>
          <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
            {items.map((item) => (
              <DiscographyAlbumRow
                key={item.album.id}
                album={item.album}
                artistId={artistId}
                returnTo={returnTo}
                inCollections={item.inCollections}
                availableCollections={item.availableCollections}
                hasAlbumCollections={hasAlbumCollections}
                hidden={item.hidden}
                showHidden={showHidden}
              />
            ))}
          </ul>
          {loading ? (
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-zinc-500">
              <span className="shelf-spinner" />
              Loading albums…
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>
          ) : null}
          {!loading && items.length < total ? (
            <button
              type="button"
              onClick={() => {
                void loadFrom(items.length);
              }}
              className="mt-3 text-sm underline"
            >
              Show more ({total - items.length})
            </button>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
