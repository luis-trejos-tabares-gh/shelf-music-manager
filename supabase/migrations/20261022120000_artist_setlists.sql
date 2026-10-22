-- Cached Setlist.fm payloads (24h TTL is enforced in app code).

create table public.artist_setlists (
  artist_id uuid primary key references public.artists (id) on delete cascade,
  payload jsonb not null default '[]'::jsonb,
  fetched_at timestamptz not null default now()
);

alter table public.artist_setlists enable row level security;

create policy "catalog_select_authenticated"
  on public.artist_setlists for select to authenticated using (true);

grant select on table public.artist_setlists to authenticated;
grant all on table public.artist_setlists to service_role;
