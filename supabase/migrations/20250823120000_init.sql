-- Catalog identity (MusicBrainz) + user shelves and song playlists.
-- No like / love / favorite / rating tables.

create type public.collection_kind as enum ('album', 'artist', 'recording');

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

create table public.artists (
  id uuid primary key default gen_random_uuid(),
  mbid uuid not null unique,
  name text not null,
  bio text,
  urls jsonb not null default '{}'::jsonb,
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.releases (
  id uuid primary key default gen_random_uuid(),
  mbid uuid not null unique,
  title text not null,
  release_date date,
  type text,
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.release_artists (
  release_id uuid not null references public.releases (id) on delete cascade,
  artist_id uuid not null references public.artists (id) on delete cascade,
  credit_name text,
  position integer not null default 0,
  primary key (release_id, artist_id)
);

create table public.recordings (
  id uuid primary key default gen_random_uuid(),
  mbid uuid not null unique,
  release_id uuid references public.releases (id) on delete set null,
  title text not null,
  position integer,
  isrc text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.release_external_ids (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.releases (id) on delete cascade,
  platform text not null,
  external_id text not null,
  url text,
  unique (release_id, platform)
);

create table public.recording_external_ids (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null references public.recordings (id) on delete cascade,
  platform text not null,
  external_id text not null,
  url text,
  unique (recording_id, platform)
);

create table public.availability (
  release_id uuid primary key references public.releases (id) on delete cascade,
  odesli_payload jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now()
);

create table public.similar_artists (
  artist_id uuid not null references public.artists (id) on delete cascade,
  related_id uuid not null references public.artists (id) on delete cascade,
  source text not null,
  score numeric,
  primary key (artist_id, related_id, source),
  check (artist_id <> related_id)
);

-- ---------------------------------------------------------------------------
-- Collections: homogeneous shelves (album | artist | recording)
-- ---------------------------------------------------------------------------

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  parent_id uuid references public.collections (id) on delete set null,
  kind public.collection_kind not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections (id) on delete cascade,
  position integer not null default 0,
  notes text,
  release_id uuid references public.releases (id) on delete cascade,
  artist_id uuid references public.artists (id) on delete cascade,
  recording_id uuid references public.recordings (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (
    (release_id is not null)::integer
    + (artist_id is not null)::integer
    + (recording_id is not null)::integer
    = 1
  )
);

create unique index collection_items_release_uidx
  on public.collection_items (collection_id, release_id)
  where release_id is not null;

create unique index collection_items_artist_uidx
  on public.collection_items (collection_id, artist_id)
  where artist_id is not null;

create unique index collection_items_recording_uidx
  on public.collection_items (collection_id, recording_id)
  where recording_id is not null;

-- ---------------------------------------------------------------------------
-- Playlists: ordered songs (Spotify id reserved for later sync)
-- ---------------------------------------------------------------------------

create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  spotify_playlist_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.playlist_tracks (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  recording_id uuid not null references public.recordings (id) on delete cascade,
  position integer not null,
  created_at timestamptz not null default now()
);

create unique index playlist_tracks_position_uidx
  on public.playlist_tracks (playlist_id, position);

-- ---------------------------------------------------------------------------
-- Follows (watch an artist — not a like)
-- ---------------------------------------------------------------------------

create table public.follows (
  user_id uuid not null references auth.users (id) on delete cascade,
  artist_id uuid not null references public.artists (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, artist_id)
);

create index collections_user_id_idx on public.collections (user_id);
create index playlists_user_id_idx on public.playlists (user_id);
create index recordings_release_id_idx on public.recordings (release_id);
create index follows_artist_id_idx on public.follows (artist_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger artists_set_updated_at
  before update on public.artists
  for each row execute function public.set_updated_at();

create trigger releases_set_updated_at
  before update on public.releases
  for each row execute function public.set_updated_at();

create trigger recordings_set_updated_at
  before update on public.recordings
  for each row execute function public.set_updated_at();

create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function public.set_updated_at();

create trigger playlists_set_updated_at
  before update on public.playlists
  for each row execute function public.set_updated_at();

create or replace function public.prevent_collection_kind_change()
returns trigger
language plpgsql
as $$
begin
  if new.kind is distinct from old.kind
     and exists (
       select 1 from public.collection_items where collection_id = old.id
     ) then
    raise exception 'cannot change collection kind while it has items';
  end if;
  return new;
end;
$$;

create trigger collections_prevent_kind_change
  before update of kind on public.collections
  for each row execute function public.prevent_collection_kind_change();

create or replace function public.validate_collection_parent()
returns trigger
language plpgsql
as $$
declare
  parent_user uuid;
  parent_kind public.collection_kind;
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'collection cannot be its own parent';
  end if;

  select user_id, kind into parent_user, parent_kind
  from public.collections
  where id = new.parent_id;

  if parent_user is null then
    raise exception 'parent collection not found';
  end if;

  if parent_user <> new.user_id then
    raise exception 'parent collection must belong to the same user';
  end if;

  if parent_kind <> new.kind then
    raise exception 'parent collection must have the same kind';
  end if;

  return new;
end;
$$;

create trigger collections_validate_parent
  before insert or update of parent_id, user_id, kind on public.collections
  for each row execute function public.validate_collection_parent();

create or replace function public.validate_collection_item_kind()
returns trigger
language plpgsql
as $$
declare
  item_kind public.collection_kind;
begin
  select kind into item_kind
  from public.collections
  where id = new.collection_id;

  if item_kind is null then
    raise exception 'collection not found';
  end if;

  if item_kind = 'album' and new.release_id is null then
    raise exception 'album collections require release_id';
  elsif item_kind = 'artist' and new.artist_id is null then
    raise exception 'artist collections require artist_id';
  elsif item_kind = 'recording' and new.recording_id is null then
    raise exception 'recording collections require recording_id';
  end if;

  return new;
end;
$$;

create trigger collection_items_validate_kind
  before insert or update on public.collection_items
  for each row execute function public.validate_collection_item_kind();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.artists enable row level security;
alter table public.releases enable row level security;
alter table public.release_artists enable row level security;
alter table public.recordings enable row level security;
alter table public.release_external_ids enable row level security;
alter table public.recording_external_ids enable row level security;
alter table public.availability enable row level security;
alter table public.similar_artists enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_tracks enable row level security;
alter table public.follows enable row level security;

create policy "catalog_select_authenticated"
  on public.artists for select to authenticated using (true);

create policy "catalog_select_authenticated"
  on public.releases for select to authenticated using (true);

create policy "catalog_select_authenticated"
  on public.release_artists for select to authenticated using (true);

create policy "catalog_select_authenticated"
  on public.recordings for select to authenticated using (true);

create policy "catalog_select_authenticated"
  on public.release_external_ids for select to authenticated using (true);

create policy "catalog_select_authenticated"
  on public.recording_external_ids for select to authenticated using (true);

create policy "catalog_select_authenticated"
  on public.availability for select to authenticated using (true);

create policy "catalog_select_authenticated"
  on public.similar_artists for select to authenticated using (true);

create policy "collections_own_all"
  on public.collections for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "collection_items_own_all"
  on public.collection_items for all to authenticated
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_items.collection_id
        and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.collections c
      where c.id = collection_items.collection_id
        and c.user_id = (select auth.uid())
    )
  );

create policy "playlists_own_all"
  on public.playlists for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "playlist_tracks_own_all"
  on public.playlist_tracks for all to authenticated
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_tracks.playlist_id
        and p.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_tracks.playlist_id
        and p.user_id = (select auth.uid())
    )
  );

create policy "follows_own_all"
  on public.follows for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
