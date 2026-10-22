-- Albums are MusicBrainz release-groups. A recording can appear on many albums.

comment on column public.releases.mbid is
  'MusicBrainz release-group MBID (the album), not a specific medium/edition.';

create table public.release_tracks (
  release_id uuid not null references public.releases (id) on delete cascade,
  recording_id uuid not null references public.recordings (id) on delete cascade,
  position integer,
  primary key (release_id, recording_id)
);

create index release_tracks_recording_id_idx
  on public.release_tracks (recording_id);

alter table public.release_tracks enable row level security;

create policy "catalog_select_authenticated"
  on public.release_tracks for select to authenticated using (true);

drop index if exists public.recordings_release_id_idx;

alter table public.recordings
  drop column if exists release_id,
  drop column if exists position;
