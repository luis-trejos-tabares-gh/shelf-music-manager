import "server-only";
import { z } from "zod";

export function getServiceRoleKey() {
  return z.string().min(1).parse(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getMusicBrainzUserAgent() {
  return z.string().min(1).parse(process.env.MUSICBRAINZ_USER_AGENT);
}

export function getSetlistFmApiKey() {
  const key = process.env.SETLISTFM_API_KEY?.trim();
  return key ? key : undefined;
}
