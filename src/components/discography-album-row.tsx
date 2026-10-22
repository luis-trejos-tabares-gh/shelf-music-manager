"use client";

import Link from "next/link";
import { useState } from "react";
import { hideRelease, loadAlbumDetails, unhideRelease, type AlbumDetails } from "@/app/actions/discography";
import { AddAlbumForm } from "@/components/add-album-form";
import { PendingButton } from "@/components/pending-button";
import { ShelfChip } from "@/components/shelf-chip";
import { formatDuration } from "@/lib/catalog/media";

export type DiscographyAlbum = {
  id: string;
  mbid: string;
  title: string;
  release_date: string | null;
  cover_url: string | null;
};

export function DiscographyAlbumRow({
  album,
  artistId,
  returnTo,
  inCollections,
  availableCollections,
  hasAlbumCollections,
  hidden,
  showHidden,
}: {
  album: DiscographyAlbum;
  artistId: string;
  returnTo: string;
  inCollections: Array<{ id: string; name: string; itemId: string }>;
  availableCollections: Array<{ id: string; name: string }>;
  hasAlbumCollections: boolean;
  hidden: boolean;
  showHidden: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<AlbumDetails | null>(null);
  const [coverFailed, setCoverFailed] = useState(false);

  async function toggleDetails() {
    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);
    if (details || loading) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setDetails(await loadAlbumDetails(album.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load album details");
    } finally {
      setLoading(false);
    }
  }

  const meta = [
    album.release_date?.slice(0, 4),
    open ? formatDuration(details?.durationMs) : null,
    open ? details?.labelName : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="py-4">
      <div className="flex items-start gap-4">
        {album.cover_url && !coverFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={album.cover_url}
            alt=""
            loading="lazy"
            onError={() => setCoverFailed(true)}
            className="h-20 w-20 rounded object-cover"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            <Link href={`/releases/${album.id}`} className="underline">
              {album.title}
            </Link>
            {hidden ? (
              <span className="ml-2 text-xs font-normal text-zinc-500">Hidden</span>
            ) : null}
          </p>
          {meta ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{meta}</p>
          ) : null}
          {inCollections.length ? (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {inCollections.map((collection) => (
                <ShelfChip
                  key={collection.itemId}
                  collectionId={collection.id}
                  name={collection.name}
                  itemId={collection.itemId}
                  returnTo={returnTo}
                />
              ))}
            </div>
          ) : null}
          {availableCollections.length ? (
            <AddAlbumForm
              mbid={album.mbid}
              returnTo={returnTo}
              collections={availableCollections}
            />
          ) : hasAlbumCollections ? null : (
            <p className="mt-2 text-xs text-zinc-500">
              Create an album shelf to add this.
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            <button
              type="button"
              onClick={() => {
                void toggleDetails();
              }}
              className="underline"
            >
              {open ? "Hide details" : "Details"}
            </button>
            <form action={hidden ? unhideRelease : hideRelease}>
              <input type="hidden" name="release_id" value={album.id} />
              <input type="hidden" name="artist_id" value={artistId} />
              <input type="hidden" name="show_hidden" value={showHidden ? "1" : ""} />
              <PendingButton
                pendingLabel={hidden ? "Unhiding…" : "Hiding…"}
                className="underline disabled:opacity-60"
              >
                {hidden ? "Unhide" : "Hide"}
              </PendingButton>
            </form>
          </div>
          {open ? (
            <div className="mt-3">
              {loading ? (
                <p className="inline-flex items-center gap-2 text-sm text-zinc-500">
                  <span className="shelf-spinner" />
                  Loading tracklist…
                </p>
              ) : null}
              {error ? (
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              ) : null}
              {details && !loading ? (
                details.tracks.length ? (
                  <ol className="list-decimal space-y-0.5 pl-5 text-sm text-zinc-500">
                    {details.tracks.map((track) => {
                      const duration = formatDuration(track.lengthMs);
                      const credit =
                        track.creditName && track.creditName !== details.albumCredit
                          ? track.creditName
                          : null;

                      return (
                        <li key={track.id ?? `${album.id}-${track.position}`}>
                          {track.id ? (
                            <Link href={`/recordings/${track.id}`} className="underline">
                              {track.title}
                            </Link>
                          ) : (
                            track.title
                          )}
                          {duration ? ` · ${duration}` : ""}
                          {credit ? ` · ${credit}` : ""}
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="text-sm text-zinc-500">No official tracklist.</p>
                )
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}
