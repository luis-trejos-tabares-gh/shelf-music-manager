-- Discography fields: one canonical official MB release per release-group.

alter table public.artists
  add column if not exists discography_fetched_at timestamptz;

alter table public.releases
  add column if not exists secondary_types text[] not null default '{}'::text[],
  add column if not exists label_name text,
  add column if not exists duration_ms integer,
  add column if not exists canonical_release_mbid uuid,
  add column if not exists enriched_at timestamptz;

alter table public.recordings
  add column if not exists length_ms integer;

alter table public.release_tracks
  add column if not exists credit_name text;
