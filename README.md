# Shelf

A personal library for albums, artists, and songs. Typed shelves, song playlists, and MusicBrainz search. Not a player.

## What it does

- **Home (`/`)** — mark, manifesto, and a strip of recent shelf items when you are signed in
- **Sign up / sign in** — email and password. Local Auth skips email confirmation
- **Search (`/search`)** — MusicBrainz albums, artists, and songs. Optional artist / year / album filters. Covers, artist portraits and short bios, expand-in-place details. Add to a matching shelf (or a playlist for songs). Hide a bad hit from the current list
- **Shelves (`/shelves`)** — homogeneous lists: albums, artists, or songs. Add and remove items. Delete a shelf only when it is empty
- **Playlists (`/playlists`)** — ordered songs. Spotify sync is reserved, not built
- **Dossiers** — `/artists/[id]`, `/releases/[id]`, `/recordings/[id]`. Wikipedia bio and photo, Cover Art Archive fronts, categorized discography (studio first, other buckets collapsed, pages of 10), Hide for junk MusicBrainz titles, follow (not likes)
- **Following (`/following`)** — artists whose dossiers you are watching
- `/collections` still redirects to `/shelves`

Identity is MusicBrainz (albums = release groups). Streaming-link APIs are deferred; the public Odesli/Songlink API was retired in July 2026.

## Privacy

- You need an account. Rows are scoped to your user via Supabase RLS
- Catalog cache (artists, releases, recordings, covers, setlists) is shared in Postgres so MusicBrainz is not hit on every view
- Hiding a title is per-user (`hidden_releases`). It does not delete catalog rows
- Removing an item from a shelf, or deleting an empty shelf, does not delete catalog rows
- MusicBrainz, Wikipedia / Wikidata, Cover Art Archive, and optional Setlist.fm see the User-Agent (and Setlist.fm key) you configure. Do not put secrets in the client

## Tech stack

One Next.js app plus local or hosted Postgres.

| Piece | Choice | Why it is here |
| --- | --- | --- |
| App | Next.js 16 App Router, React 19, TypeScript | Server pages and server actions; `src/proxy.ts` (not `middleware`) for session |
| Auth / DB | Supabase (`@supabase/ssr`), RLS | Email/password; owner-only shelves, playlists, follows, hidden titles |
| Styling | Tailwind CSS 4, Geist | Zinc/black; no component kit |
| Identity | MusicBrainz WS/2 via `node:https` | Next `fetch` hit 503s; ~1.1s throttle and 503 retries |
| Bios / photos | Wikipedia REST + Wikidata sitelinks | From MusicBrainz url-rels, or name preview on artist search |
| Covers | Cover Art Archive `front-250` | Deterministic URL; hide on `img` error. No HEAD storm on lists |
| Shows | Setlist.fm (optional key) | Cached 24h in `artist_setlists`; omitted if the key is missing |

Browser → Next.js server actions → Supabase (RLS). Ingest and discography use the service role. MusicBrainz / Wikipedia / CAA / Setlist.fm are server-only.

## Data model (short)

- **Shelves** (`collections`) are homogeneous: `album`, `artist`, or `recording`
- **Playlists** are ordered songs (`spotify_playlist_id` reserved)
- No like / love / rating tables. Follow is a watch list
- Catalog rows use MusicBrainz IDs; platform IDs live in `*_external_ids`
- `availability` is a generic cached payload, unused until a link provider is chosen
- Discography list is cached 7 days (`artists.discography_fetched_at`). First request upserts one MusicBrainz page (100 release groups) and finishes the rest after the response. Tracklists load only when you open Details

## Local run

Needs Node 20+ and Docker Desktop (for local Supabase).

```bash
cp .env.example .env.local
npm install
npm run db:start
npx supabase status
```

Copy `API URL`, `anon key`, and `service_role key` into `.env.local`. Set a descriptive MusicBrainz User-Agent with a contact address.

```bash
npm run db:reset   # apply migrations
npm run db:types   # overwrite src/types/database.ts from local Postgres
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)  
Studio: [http://127.0.0.1:54323](http://127.0.0.1:54323)

`src/types/database.ts` ships as a hand-written match of the init migration so the app typechecks before Docker is up. Overwrite it with `npm run db:types` once the stack is running.

### Hosted Supabase

Create a project, run the SQL in `supabase/migrations/` (or `supabase db push` after linking), and put the project URL + keys in `.env.local`. Same variable names as local.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js app |
| `npm run db:start` / `db:stop` | Local Supabase stack |
| `npm run db:reset` | Reset DB and apply migrations |
| `npm run db:types` | Generate TypeScript types from local Postgres |

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Local `http://127.0.0.1:54321` or hosted project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (browser + RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server ingest only. Never expose to the client |
| `MUSICBRAINZ_USER_AGENT` | Required. e.g. `shelf/0.1.0 (you@example.com)` |
| `SETLISTFM_API_KEY` | Optional. Recent shows on artist pages. [setlist.fm/settings/api](https://www.setlist.fm/settings/api) |

Do not commit `.env.local`.

## Not in this slice

Spotify import/export, lyrics, recommendation jobs, or the retired Odesli/Songlink API.
