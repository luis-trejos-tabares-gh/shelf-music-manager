-- The public Odesli / Songlink API was retired on 31 July 2026
-- (HTTP 401 PUBLIC_API_ACCESS_DEPRECATED). Keep availability as a generic
-- cache for a future link source; do not store Odesli responses.

alter table public.availability
  rename column odesli_payload to payload;

alter table public.availability
  add column source text not null default 'manual';
