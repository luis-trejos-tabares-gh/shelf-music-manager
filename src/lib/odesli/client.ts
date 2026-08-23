import "server-only";
import { getOdesliApiKey } from "@/lib/env.server";

const ODESLI_API = "https://api.song.link/v1-alpha.1/links";

export type OdesliPlatformLink = {
  url: string;
  entityUniqueId?: string;
  nativeAppUriDesktop?: string;
  nativeAppUriMobile?: string;
};

export type OdesliEntity = {
  id: string;
  type: "song" | "album";
  title?: string;
  artistName?: string;
  thumbnailUrl?: string;
  apiProvider?: string;
  platforms?: string[];
};

export type OdesliLinksResponse = {
  entityUniqueId: string;
  userCountry: string;
  pageUrl: string;
  linksByPlatform: Record<string, OdesliPlatformLink>;
  entitiesByUniqueId: Record<string, OdesliEntity>;
};

export type OdesliEntityType = "song" | "album";

async function odesliFetch(
  params: Record<string, string>,
): Promise<OdesliLinksResponse> {
  const ODESLI_API_KEY = getOdesliApiKey();
  const url = new URL(ODESLI_API);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  if (ODESLI_API_KEY) {
    url.searchParams.set("key", ODESLI_API_KEY);
  }

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Odesli ${response.status}: ${body}`);
  }

  return (await response.json()) as OdesliLinksResponse;
}

export function getLinksByUrl(url: string, userCountry = "US") {
  return odesliFetch({ url, userCountry });
}

export function getLinksById(
  id: string,
  platform: string,
  type: OdesliEntityType,
  userCountry = "US",
) {
  return odesliFetch({ id, platform, type, userCountry });
}
