"use client";

import { useState } from "react";
import {
  previewAlbumDetails,
  previewArtistProfile,
  previewRecordingDetails,
  type ArtistPreview,
  type RecordingPreview,
  type SearchMembership,
} from "@/app/actions/search";
import type { AlbumDetails } from "@/app/actions/discography";
import { AddAlbumForm } from "@/components/add-album-form";
import { LazyCover } from "@/components/lazy-cover";
import { PendingButton } from "@/components/pending-button";
import { ShelfChip } from "@/components/shelf-chip";
import { formatDuration } from "@/lib/catalog/media";
import type { CollectionKind } from "@/lib/catalog/types";
import { addToLibrary } from "@/app/actions/catalog";

export type SearchHit = {
  mbid: string;
  title: string;
  subtitle?: string | null;
  year?: string | null;
  album?: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  inCollections?: SearchMembership[];
};

export function SearchResultRow({
  result,
  type,
  returnTo,
  collections,
  playlists,
  onHide,
}: {
  result: SearchHit;
  type: CollectionKind;
  returnTo: string;
  collections: Array<{ id: string; name: string }>;
  playlists: Array<{ id: string; name: string }>;
  onHide: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [albumDetails, setAlbumDetails] = useState<AlbumDetails | null>(null);
  const [recordingDetails, setRecordingDetails] =
    useState<RecordingPreview | null>(null);
  const [artistDetails, setArtistDetails] = useState<ArtistPreview | null>(null);

  const canPreview =
    type === "album" || type === "recording" || type === "artist";

  async function toggleDetails() {
    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);
    if (albumDetails || recordingDetails || artistDetails || loading) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (type === "album") {
        setAlbumDetails(await previewAlbumDetails(result.mbid));
      } else if (type === "recording") {
        setRecordingDetails(await previewRecordingDetails(result.mbid));
      } else {
        setArtistDetails(await previewArtistProfile(result.mbid));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load details");
    } finally {
      setLoading(false);
    }
  }

  const availableCollections = collections.filter(
    (collection) => !result.inCollections?.some((item) => item.id === collection.id),
  );

  const meta = [
    result.subtitle,
    result.year,
    result.album,
    open && type === "album" ? formatDuration(albumDetails?.durationMs) : null,
    open && type === "album" ? albumDetails?.labelName : null,
    open && type === "recording" ? formatDuration(recordingDetails?.lengthMs) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="shelf-fade-up py-4">
      <div className="flex items-start gap-4">
        {result.coverUrl ? (
          <LazyCover
            src={result.coverUrl}
            className="h-20 w-20 rounded object-cover"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="font-medium">{result.title}</p>
          {meta ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{meta}</p>
          ) : null}
          {result.bio ? (
            <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
              {result.bio}
            </p>
          ) : null}
          {result.inCollections?.length ? (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {result.inCollections.map((collection) => (
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

          {type === "album" ? (
            availableCollections.length ? (
              <AddAlbumForm
                mbid={result.mbid}
                returnTo={returnTo}
                collections={availableCollections}
              />
            ) : collections.length ? null : (
              <p className="mt-2 text-xs text-zinc-500">
                Create an album shelf to add this.
              </p>
            )
          ) : (
            <AddSearchForm
              type={type}
              mbid={result.mbid}
              returnTo={returnTo}
              collections={availableCollections}
              playlists={playlists}
            />
          )}

          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            {canPreview ? (
              <button
                type="button"
                onClick={() => {
                  void toggleDetails();
                }}
                className="underline"
              >
                {open ? "Hide details" : "Details"}
              </button>
            ) : null}
            <button type="button" onClick={onHide} className="underline">
              Hide
            </button>
          </div>

          {open ? (
            <div className="mt-3">
              {loading ? (
                <p className="inline-flex items-center gap-2 text-sm text-zinc-500">
                  <span className="shelf-spinner" />
                  Loading details…
                </p>
              ) : null}
              {error ? (
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              ) : null}
              {type === "album" && albumDetails && !loading ? (
                albumDetails.tracks.length ? (
                  <ol className="list-decimal space-y-0.5 pl-5 text-sm text-zinc-500">
                    {albumDetails.tracks.map((track) => {
                      const duration = formatDuration(track.lengthMs);
                      const credit =
                        track.creditName &&
                        track.creditName !== albumDetails.albumCredit
                          ? track.creditName
                          : null;

                      return (
                        <li key={`${result.mbid}-${track.position}-${track.title}`}>
                          {track.title}
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
              {type === "recording" && recordingDetails && !loading ? (
                recordingDetails.albums.length ? (
                  <ul className="space-y-0.5 text-sm text-zinc-500">
                    {recordingDetails.albums.map((album, index) => (
                      <li key={`${result.mbid}-${album.title}-${index}`}>
                        {album.title}
                        {album.date ? ` · ${album.date}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-500">No album credits.</p>
                )
              ) : null}
              {type === "artist" && artistDetails && !loading ? (
                artistDetails.bio ? (
                  <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {artistDetails.bio}
                  </p>
                ) : (
                  <p className="text-sm text-zinc-500">No biography.</p>
                )
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function AddSearchForm({
  type,
  mbid,
  returnTo,
  collections,
  playlists,
}: {
  type: CollectionKind;
  mbid: string;
  returnTo: string;
  collections: Array<{ id: string; name: string }>;
  playlists: Array<{ id: string; name: string }>;
}) {
  if (!collections.length && !playlists.length) {
    return (
      <p className="mt-2 text-xs text-zinc-500">
        {type === "recording"
          ? "Create a song shelf or playlist first"
          : `Create a ${type} shelf first`}
      </p>
    );
  }

  return (
    <form action={addToLibrary} className="mt-2 flex flex-col gap-2 sm:flex-row">
      <input type="hidden" name="entity_type" value={type} />
      <input type="hidden" name="mbid" value={mbid} />
      <input type="hidden" name="return_to" value={returnTo} />
      <select
        name="destination"
        required
        className="flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
        defaultValue=""
      >
        <option value="" disabled>
          Add to…
        </option>
        {collections.map((collection) => (
          <option key={collection.id} value={`collection:${collection.id}`}>
            Shelf: {collection.name}
          </option>
        ))}
        {playlists.map((playlist) => (
          <option key={playlist.id} value={`playlist:${playlist.id}`}>
            Playlist: {playlist.name}
          </option>
        ))}
      </select>
      <PendingButton
        pendingLabel="Adding…"
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-60 dark:border-zinc-700"
      >
        Add
      </PendingButton>
    </form>
  );
}
