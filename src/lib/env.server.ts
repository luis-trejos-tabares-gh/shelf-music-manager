import "server-only";
import { z } from "zod";

export function getServiceRoleKey() {
  return z.string().min(1).parse(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getMusicBrainzUserAgent() {
  return z.string().min(1).parse(process.env.MUSICBRAINZ_USER_AGENT);
}

export function getOdesliApiKey() {
  const key = process.env.ODESLI_API_KEY;
  return key ? key : undefined;
}
