"use server";

import { redirect } from "next/navigation";
import { ingestEntity } from "@/lib/catalog/ingest";
import type { CollectionKind } from "@/lib/catalog/types";
import { withNotice } from "@/lib/notice";
import { createClient } from "@/lib/supabase/server";

const kinds = new Set<CollectionKind>(["album", "artist", "recording"]);

function fail(path: string, message: string): never {
  redirect(withNotice(path, "error", message));
}

export async function addToLibrary(formData: FormData) {
  const entityType = String(formData.get("entity_type") ?? "") as CollectionKind;
  const mbid = String(formData.get("mbid") ?? "").trim();
  const destination = String(formData.get("destination") ?? "").trim();
  const returnTo = String(formData.get("return_to") ?? "/search");
  const [destinationKind, destinationId] = destination.split(":");
  const collectionId = destinationKind === "collection" ? destinationId : "";
  const playlistId = destinationKind === "playlist" ? destinationId : "";

  if (!kinds.has(entityType) || !mbid) {
    fail(returnTo, "Missing search result");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let ingested: Awaited<ReturnType<typeof ingestEntity>>;
  try {
    ingested = await ingestEntity(entityType, mbid);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save to Shelf";
    fail(returnTo, message);
  }

  if (playlistId) {
    if (entityType !== "recording") {
      fail(returnTo, "Playlists only accept songs");
    }

    const { data: lastTrack } = await supabase
      .from("playlist_tracks")
      .select("position")
      .eq("playlist_id", playlistId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await supabase.from("playlist_tracks").insert({
      playlist_id: playlistId,
      recording_id: ingested.row.id,
      position: (lastTrack?.position ?? -1) + 1,
    });

    if (error) {
      fail(returnTo, error.message);
    }

    const { data: playlist } = await supabase
      .from("playlists")
      .select("name")
      .eq("id", playlistId)
      .single();

    redirect(
      withNotice(
        `/playlists/${playlistId}`,
        "added",
        `Added to ${playlist?.name ?? "playlist"}`,
      ),
    );
  }

  if (!collectionId) {
    fail(returnTo, "Choose a shelf or playlist");
  }

  const { data: collection, error: collectionError } = await supabase
    .from("collections")
    .select("id, kind, name")
    .eq("id", collectionId)
    .single();

  if (collectionError || !collection) {
    fail(returnTo, collectionError?.message ?? "Shelf not found");
  }

  if (collection.kind !== entityType) {
    fail(returnTo, `That shelf only accepts ${collection.kind}s`);
  }

  const { error } = await supabase.from("collection_items").insert({
    collection_id: collectionId,
    release_id: entityType === "album" ? ingested.row.id : null,
    artist_id: entityType === "artist" ? ingested.row.id : null,
    recording_id: entityType === "recording" ? ingested.row.id : null,
  });

  if (error) {
    fail(
      returnTo,
      error.code === "23505" ? "Already on that shelf" : error.message,
    );
  }

  const notice = `Added to ${collection.name}`;
  const returnPath = returnTo.split("?")[0];
  if (returnPath.startsWith("/artists/") || returnPath.startsWith("/search")) {
    redirect(withNotice(returnTo, "added", notice));
  }

  redirect(withNotice(`/shelves/${collectionId}`, "added", notice));
}

export async function removeFromLibrary(formData: FormData) {
  const itemId = String(formData.get("item_id") ?? "").trim();
  const returnTo = String(formData.get("return_to") ?? "/shelves");

  if (!itemId) {
    fail(returnTo, "Missing shelf item");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: item } = await supabase
    .from("collection_items")
    .select("id, collections(name)")
    .eq("id", itemId)
    .single();

  const { error } = await supabase.from("collection_items").delete().eq("id", itemId);

  if (error) {
    fail(returnTo, error.message);
  }

  const name =
    item?.collections && !Array.isArray(item.collections)
      ? item.collections.name
      : "shelf";

  redirect(withNotice(returnTo, "added", `Removed from ${name}`));
}
