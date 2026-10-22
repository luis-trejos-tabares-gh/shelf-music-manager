import "server-only";
import { getMusicBrainzUserAgent } from "@/lib/env.server";
import { httpsHead } from "@/lib/http";

export function coverArtFrontUrl(releaseGroupMbid: string) {
  return `https://coverartarchive.org/release-group/${releaseGroupMbid}/front-250`;
}

export function coverArtReleaseFrontUrl(releaseMbid: string) {
  return `https://coverartarchive.org/release/${releaseMbid}/front-250`;
}

export async function findCoverArtUrl(releaseGroupMbid: string) {
  const url = coverArtFrontUrl(releaseGroupMbid);

  try {
    const response = await httpsHead(new URL(url), {
      "User-Agent": getMusicBrainzUserAgent(),
    });

    // CAA serves the front via redirect; store the stable CAA URL when art exists.
    if (response.status === 404 || response.status >= 500) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}
