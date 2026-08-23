# Music catalog

Personal library for organizing albums, artists, and songs, plus song playlists. Not a player — streaming links and Spotify sync come later.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase (local CLI and hosted)
- MusicBrainz + Odesli clients (no feature routes yet)

## Setup

```bash
cp .env.example .env.local
npm install
```

### Local Supabase

Requires Docker Desktop.

```bash
npm run db:start
npx supabase status
```

Copy `API URL`, `anon key`, and `service_role key` into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
MUSICBRAINZ_USER_AGENT=music-management-engine/0.1.0 (you@example.com)
```

```bash
npm run db:reset   # apply migrations
npm run db:types   # regenerate src/types/database.ts from the local schema
npm run dev
```

Studio: [http://127.0.0.1:54323](http://127.0.0.1:54323)

`src/types/database.ts` ships as a hand-written match of the init migration so the app typechecks before Docker is running. Overwrite it with `npm run db:types` once the local stack is up.

### Hosted Supabase

Create a project, run the SQL in `supabase/migrations/` (or `supabase db push` after linking), and put the project URL + keys in `.env.local`. Same variable names as local.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js placeholder app |
| `npm run db:start` / `db:stop` | Local Supabase stack |
| `npm run db:reset` | Reset DB and apply migrations |
| `npm run db:types` | Generate TypeScript types from local Postgres |

## Data model (short)

- **Collections** are homogeneous shelves: `album`, `artist`, or `recording`
- **Playlists** are ordered songs (`spotify_playlist_id` reserved for later sync)
- No like / love / rating tables
- Catalog rows use MusicBrainz IDs; platform IDs live in `*_external_ids`

## Not in this skeleton

Feature routes, auth UI, Spotify import/export, lyrics, or recommendation jobs.
