-- Per-user discography hide list. Does not delete catalog rows.

create table public.hidden_releases (
  user_id uuid not null references auth.users (id) on delete cascade,
  release_id uuid not null references public.releases (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, release_id)
);

alter table public.hidden_releases enable row level security;

create policy "hidden_releases_own_all"
  on public.hidden_releases for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update, delete on table public.hidden_releases to authenticated;
grant all on table public.hidden_releases to service_role;
