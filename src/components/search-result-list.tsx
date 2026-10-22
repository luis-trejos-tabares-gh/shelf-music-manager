"use client";

import { useState } from "react";
import {
  SearchResultRow,
  type SearchHit,
} from "@/components/search-result-row";
import type { CollectionKind } from "@/lib/catalog/types";

export function SearchResultList({
  results,
  type,
  returnTo,
  collections,
  playlists,
}: {
  results: SearchHit[];
  type: CollectionKind;
  returnTo: string;
  collections: Array<{ id: string; name: string }>;
  playlists: Array<{ id: string; name: string }>;
}) {
  const [hidden, setHidden] = useState<string[]>([]);
  const visible = results.filter((result) => !hidden.includes(result.mbid));

  if (!visible.length) {
    return (
      <li className="py-4 text-sm text-zinc-600 dark:text-zinc-400">
        No results.
      </li>
    );
  }

  return (
    <>
      {visible.map((result) => (
        <SearchResultRow
          key={result.mbid}
          result={result}
          type={type}
          returnTo={returnTo}
          collections={collections}
          playlists={playlists}
          onHide={() => setHidden((current) => [...current, result.mbid])}
        />
      ))}
    </>
  );
}
