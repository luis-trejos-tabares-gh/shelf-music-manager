"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CollectionKind } from "@/lib/catalog/types";
import { withNotice } from "@/lib/notice";

const kinds = new Set<CollectionKind>(["album", "artist", "recording"]);

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function createCollection(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "") as CollectionKind;

  if (!name || !kinds.has(kind)) {
    redirect(withNotice("/shelves", "error", "Name and kind are required"));
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("collections").insert({
    user_id: user.id,
    name,
    kind,
  });

  if (error) {
    redirect(withNotice("/shelves", "error", error.message));
  }

  redirect(withNotice("/shelves", "added", `Created ${name}`));
}

export async function deleteCollection(formData: FormData) {
  const collectionId = String(formData.get("collection_id") ?? "").trim();
  const returnTo = String(formData.get("return_to") ?? "/shelves");

  if (!collectionId) {
    redirect(withNotice("/shelves", "error", "Missing shelf"));
  }

  const { supabase } = await requireUser();
  const { data: collection } = await supabase
    .from("collections")
    .select("id, name")
    .eq("id", collectionId)
    .single();

  if (!collection) {
    redirect(withNotice("/shelves", "error", "Shelf not found"));
  }

  const { count, error: countError } = await supabase
    .from("collection_items")
    .select("id", { count: "exact", head: true })
    .eq("collection_id", collectionId);

  if (countError) {
    redirect(withNotice(returnTo, "error", countError.message));
  }

  if ((count ?? 0) > 0) {
    redirect(withNotice(returnTo, "error", "That shelf still has items"));
  }

  const { error } = await supabase.from("collections").delete().eq("id", collectionId);

  if (error) {
    redirect(withNotice(returnTo, "error", error.message));
  }

  redirect(withNotice("/shelves", "added", `Removed ${collection.name}`));
}

export async function createPlaylist(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    redirect(withNotice("/playlists", "error", "Name is required"));
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("playlists").insert({
    user_id: user.id,
    name,
    description: description || null,
  });

  if (error) {
    redirect(withNotice("/playlists", "error", error.message));
  }

  redirect(withNotice("/playlists", "added", `Created ${name}`));
}

export async function followArtist(formData: FormData) {
  const artistId = String(formData.get("artist_id") ?? "").trim();
  if (!artistId) {
    redirect("/following");
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("follows").upsert({
    user_id: user.id,
    artist_id: artistId,
  });

  if (error) {
    redirect(withNotice(`/artists/${artistId}`, "error", error.message));
  }

  redirect(withNotice(`/artists/${artistId}`, "added", "Following"));
}

export async function unfollowArtist(formData: FormData) {
  const artistId = String(formData.get("artist_id") ?? "").trim();
  if (!artistId) {
    redirect("/following");
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("user_id", user.id)
    .eq("artist_id", artistId);

  if (error) {
    redirect(withNotice(`/artists/${artistId}`, "error", error.message));
  }

  redirect(withNotice(`/artists/${artistId}`, "added", "Unfollowed"));
}
