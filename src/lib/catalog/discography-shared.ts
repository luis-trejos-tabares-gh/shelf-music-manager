export const DISCOGRAPHY_PAGE_SIZE = 10;

export const DISCOGRAPHY_SECTIONS = [
  { id: "albums", label: "Albums" },
  { id: "eps", label: "EPs" },
  { id: "live", label: "Live" },
  { id: "compilations", label: "Compilations" },
  { id: "splits", label: "Splits" },
  { id: "soundtracks", label: "Soundtracks" },
  { id: "singles", label: "Singles" },
  { id: "other", label: "Other" },
] as const;

export type DiscographyBucket = (typeof DISCOGRAPHY_SECTIONS)[number]["id"];

export type DiscographyRelease = {
  id: string;
  mbid: string;
  title: string;
  release_date: string | null;
  cover_url: string | null;
};

export type DiscographyRow = {
  album: DiscographyRelease;
  inCollections: Array<{ id: string; name: string; itemId: string }>;
  availableCollections: Array<{ id: string; name: string }>;
  hidden: boolean;
};
