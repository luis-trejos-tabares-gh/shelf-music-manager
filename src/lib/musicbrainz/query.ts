function escapeLucene(value: string) {
  return value.replace(/([+\-!(){}[\]^"~*?:\\/])/g, "\\$1");
}

function quotedField(field: string, value: string) {
  return `${field}:"${escapeLucene(value)}"`;
}

function yearField(field: string, year: string) {
  return /^\d{4}$/.test(year) ? `${field}:${year}` : null;
}

function joinClauses(clauses: Array<string | null | undefined>) {
  return clauses.filter((clause): clause is string => Boolean(clause)).join(" AND ");
}

export function buildReleaseGroupQuery({
  q,
  artist,
  year,
}: {
  q?: string;
  artist?: string;
  year?: string;
}) {
  return joinClauses([
    q ? quotedField("releasegroup", q) : null,
    artist ? quotedField("artist", artist) : null,
    yearField("firstreleasedate", year ?? ""),
  ]);
}

export function buildRecordingQuery({
  q,
  artist,
  year,
  album,
}: {
  q?: string;
  artist?: string;
  year?: string;
  album?: string;
}) {
  return joinClauses([
    q ? quotedField("recording", q) : null,
    artist ? quotedField("artist", artist) : null,
    yearField("date", year ?? ""),
    album ? quotedField("release", album) : null,
  ]);
}
