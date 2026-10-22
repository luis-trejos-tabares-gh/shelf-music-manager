import type { Json } from "@/types/database";
import type { MusicBrainzRelation } from "@/lib/musicbrainz/client";

const relationKeys: Record<string, string> = {
  "official homepage": "official",
  discogs: "discogs",
  bandcamp: "bandcamp",
  wikipedia: "wikipedia",
  wikidata: "wikidata",
  youtube: "youtube",
  "social network": "social",
};

export function isEmptyUrls(urls: Json | null | undefined) {
  if (!urls || typeof urls !== "object" || Array.isArray(urls)) {
    return true;
  }

  return Object.keys(urls).length === 0;
}

export function urlsRecord(urls: Json | null | undefined) {
  if (!urls || typeof urls !== "object" || Array.isArray(urls)) {
    return {} as Record<string, string>;
  }

  const record: Record<string, string> = {};

  for (const [key, value] of Object.entries(urls)) {
    if (typeof value === "string" && value) {
      record[key] = value;
    }
  }

  return record;
}

export function mapUrlRelations(relations?: MusicBrainzRelation[]) {
  const urls: Record<string, string> = {};

  for (const relation of relations ?? []) {
    const resource = relation.url?.resource;
    if (!resource || !relation.type) {
      continue;
    }

    let key = relationKeys[relation.type] ?? relation.type.replace(/\s+/g, "_");

    if (key === "social") {
      if (resource.includes("instagram.com")) {
        key = "instagram";
      } else if (resource.includes("twitter.com") || resource.includes("x.com")) {
        key = "twitter";
      } else if (resource.includes("facebook.com")) {
        key = "facebook";
      }
    }

    if (!urls[key]) {
      urls[key] = resource;
    }
  }

  return urls;
}

export function annotationText(
  annotation?: string | { text?: string },
  fallback?: string,
) {
  if (typeof annotation === "string" && annotation.trim()) {
    return annotation.trim();
  }

  if (annotation && typeof annotation === "object" && annotation.text?.trim()) {
    return annotation.text.trim();
  }

  return fallback?.trim() || null;
}
