const urlLabels: Record<string, string> = {
  official: "Official site",
  discogs: "Discogs",
  bandcamp: "Bandcamp",
  wikipedia: "Wikipedia",
  wikidata: "Wikidata",
  youtube: "YouTube",
  instagram: "Instagram",
  twitter: "X",
  facebook: "Facebook",
  social: "Social",
};

export function urlLabel(key: string) {
  return urlLabels[key] ?? key.replace(/_/g, " ");
}
