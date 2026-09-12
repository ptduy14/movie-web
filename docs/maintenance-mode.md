# Maintenance mode

A single env var takes the site offline behind a standalone maintenance page,
without touching code.

```env
MAINTENANCE_MODE=true   # gated
MAINTENANCE_MODE=false  # normal app (default — absent counts as false)
```

Server-only on purpose: nothing in the browser needs the flag, and a
`NEXT_PUBLIC_` var would be inlined into the client bundle. On Vercel, change
the value in **Settings → Environment Variables**, then **Redeploy** — env
changes only apply to a new deployment.

## What happens when it's on

```
request
  └─ middleware.ts               ← the gate, before anything else runs
       ├─ /maintenance/*         → passes through
       └─ everything else        → rewrite to /maintenance/{locale}
                                   + header `x-robots-tag: noindex`
```

The rewrite is the whole point. `/maintenance/[locale]` lives **outside** the
`[locale]` segment, so a gated request never renders `app/[locale]/layout.tsx`
and therefore never mounts `Providers`: no Redux store, no redux-persist, no
PostHog, no Firebase auth listener, no disclaimer/intro gates, no header or
footer — and no movie API call from any of them.

Locale for the page is resolved in middleware: URL prefix → `NEXT_LOCALE`
cookie → Vercel geo → `vi`.

When the flag is off, `/maintenance/*` redirects to `/` so the page can't be
reached or indexed by accident.

## What the page shows

1. The notice (`messages/{locale}.json` → `maintenance.*`).
2. Below the fold: a cinema schedule — upcoming releases grouped by date with a
   live countdown, plus what's now playing, each poster opening its trailer in
   a lightbox.

### One market per locale

A release calendar is only useful where the reader is, so each locale gets its
own market — `vi` → **VN**, `en` → **US** (mapped in `REGION_BY_LOCALE` in
`lib/cinema-data.ts`, mirrored by `REGIONS` in `scripts/fetch-cinema.mjs`).

That means different release dates, different titles **and different poster
artwork**: TMDB serves localized posters, so the VN list shows the Vietnamese
one-sheet and the US list shows the English one. Nothing is translated at
render time — both versions are baked. Headings name the market outright
("Sắp chiếu tại rạp Việt Nam" / "Coming to US cinemas") so nobody has to guess
whose schedule they're reading.

Adding a locale means adding it to both maps and re-running the script.

The schedule is a **pure file read** of `public/data/cinema.json`. The page
makes no network request at all: a page whose job is to announce an outage must
not be able to have one of its own. If the file is missing or empty, both
sections disappear and the page falls back to the notice alone.

### Refreshing the schedule

`.github/workflows/cinema-cron.yml` runs `scripts/fetch-cinema.mjs` daily
(00:30 UTC / 07:30 VN) and commits the result.

Needs the `TMDB_ACCESS_TOKEN` repo secret. Run it by hand from the Actions tab
("Update cinema schedule") or locally:

```bash
TMDB_ACCESS_TOKEN=... node scripts/fetch-cinema.mjs
```

That commit deliberately does **not** carry `[skip ci]` (unlike
`trending-cron.yml`): the page is statically generated, so it only picks up new
data when the commit triggers a deploy.

## API routes

| Route | Under maintenance |
| --- | --- |
| `/api/translate/cron-batch` | Returns `200 {status:'skipped', reason:'maintenance'}` before touching the movie API, Firestore or Groq. 200, not 503, so the GitHub Actions `curl -fsS` step stays green. |
| `/api/auth/*`, `/api/progress/sync`, `/api/image` | Untouched. None of them depend on the movie API, and no gated page can call them. |

`middleware.ts`'s matcher already excludes `/api`, `_next` and static files, so
API routes are never rewritten.

## Cron behaviour when the movie API is down

Independent of the flag. `cron-translation-service` throws
`UpstreamUnavailableError` when the movie API is unreachable or answers with
something that isn't JSON (an HTML 404/5xx page — `MovieServices` calls
`res.json()` unguarded, so that surfaces as a `SyntaxError`).

The run then reports `status: 'skipped'` and the route answers **200** instead
of 500, and the batch stops immediately rather than retrying the next page
against the same dead host. `failed` (HTTP 500) is now reserved for real
internal errors — Groq, Firestore, our own bugs.

## Checking the real site while it's gated

There's no bypass token. Set `MAINTENANCE_MODE=false` locally, or flip it on the
Vercel preview environment only.
