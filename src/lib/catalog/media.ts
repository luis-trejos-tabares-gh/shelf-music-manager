import type { Json } from "@/types/database";

export function formatDuration(ms: number | null | undefined) {
  if (ms == null || ms < 0) {
    return null;
  }

  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function firstImageUrl(images: Json | null | undefined) {
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }

  const first = images[0];
  if (first && typeof first === "object" && !Array.isArray(first)) {
    const url = first.url;
    if (typeof url === "string" && url) {
      return url;
    }
  }

  return null;
}
