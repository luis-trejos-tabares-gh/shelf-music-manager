import "server-only";
import { getMusicBrainzUserAgent } from "@/lib/env.server";
import { httpsGet } from "@/lib/http";

export type WikipediaSummary = {
  extract: string | null;
  thumbnailUrl: string | null;
  title: string | null;
  wikipediaUrl: string | null;
};

export async function fetchWikipediaSummary(wikipediaUrl: string) {
  const title = wikipediaTitleFromUrl(wikipediaUrl);
  if (!title) {
    return null;
  }

  return fetchWikipediaSummaryByTitle(title);
}

export async function fetchWikipediaSummaryByTitle(title: string) {
  const url = new URL(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
  );
  const response = await httpsGet(url, {
    Accept: "application/json",
    "User-Agent": getMusicBrainzUserAgent(),
  });

  if (response.status >= 400) {
    return null;
  }

  const payload = JSON.parse(response.body) as {
    type?: string;
    extract?: string;
    title?: string;
    content_urls?: { desktop?: { page?: string } };
    thumbnail?: { source?: string };
  };

  if (payload.type === "disambiguation") {
    return null;
  }

  return {
    extract: payload.extract?.trim() || null,
    thumbnailUrl: payload.thumbnail?.source?.trim() || null,
    title: payload.title ?? title,
    wikipediaUrl: payload.content_urls?.desktop?.page ?? null,
  } satisfies WikipediaSummary;
}

export async function fetchWikipediaArtistPreview(
  name: string,
  disambiguation?: string | null,
) {
  const titles = [name];
  if (disambiguation?.trim()) {
    titles.push(`${name} (${disambiguation.trim()})`);
  }

  for (const title of titles) {
    const summary = await fetchWikipediaSummaryByTitle(title);
    if (summary?.extract || summary?.thumbnailUrl) {
      return summary;
    }
  }

  return null;
}

export async function fetchEnwikiTitleFromWikidata(wikidataUrl: string) {
  const id = wikidataIdFromUrl(wikidataUrl);
  if (!id) {
    return null;
  }

  const url = new URL("https://www.wikidata.org/w/api.php");
  url.searchParams.set("action", "wbgetentities");
  url.searchParams.set("ids", id);
  url.searchParams.set("props", "sitelinks");
  url.searchParams.set("sitefilter", "enwiki");
  url.searchParams.set("format", "json");

  const response = await httpsGet(url, {
    Accept: "application/json",
    "User-Agent": getMusicBrainzUserAgent(),
  });

  if (response.status >= 400) {
    return null;
  }

  const payload = JSON.parse(response.body) as {
    entities?: Record<string, { sitelinks?: { enwiki?: { title?: string } } }>;
  };

  return payload.entities?.[id]?.sitelinks?.enwiki?.title ?? null;
}

function wikipediaTitleFromUrl(wikipediaUrl: string) {
  try {
    const url = new URL(wikipediaUrl);
    if (!url.hostname.endsWith("wikipedia.org")) {
      return null;
    }

    const marker = "/wiki/";
    const index = url.pathname.indexOf(marker);
    if (index === -1) {
      return null;
    }

    return decodeURIComponent(url.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

function wikidataIdFromUrl(wikidataUrl: string) {
  try {
    const url = new URL(wikidataUrl);
    if (!url.hostname.endsWith("wikidata.org")) {
      return null;
    }

    const match = url.pathname.match(/\/entity\/(Q\d+)/i)
      ?? url.pathname.match(/\/wiki\/(Q\d+)/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
