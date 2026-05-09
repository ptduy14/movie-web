# PostHog Analytics — Feature Doc

> Real-user traffic + product analytics tracking for movie-web.
> Single source of truth for every analytics decision. Updated after each phase.

**Status:** Phase 2/6 complete

---

## 1. Goals & Why PostHog

| Tracking need | Reason |
|---|---|
| Traffic / device / country | Replaces Google Analytics 4 |
| Watch funnel (browse → click → play → finish) | Measure drop-off, optimize UX |
| Search quality | `search → click result` conversion |
| Engagement (collection, comment) | Measure stickiness |
| Auth funnel | Visitor → signup → active user |

**Why not GA4:** GA4 is strong on traffic / SEO but the UI is complex, the free tier samples data, there is no free session replay, and it cannot answer questions like *"which movies do users click but never watch"*. PostHog is all-in-one (analytics + replay + feature flags + heatmaps + funnels) on a single 1M-events/month free tier.

---

## 2. Stack & file map

| File | Role |
|---|---|
| `lib/posthog/client.ts` | Singleton init, exports the `posthog` instance |
| `components/analytics/PostHogProvider.tsx` | React provider + manual pageview tracker (App Router compat) |
| `app/providers.tsx` | Mounts `PostHogProvider` in the tree |
| `next.config.mjs` | Reverse proxy `/api/__relay/*` → `us.i.posthog.com` (ad-block bypass) |
| `.env` | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_POSTHOG_UI_HOST` |

---

## 3. Architecture decisions

### 3.1. Reverse proxy `/api/__relay/*`
Ad-blockers block `*.posthog.com` directly, costing ~20-30% of real-user data. We route through our own domain via Next.js `rewrites()`.

```
Browser → POST /api/__relay/i/v0/e/        (same-origin, not blocked)
       → rewrite to https://us.i.posthog.com/i/v0/e/
       → PostHog ingestion
```

`skipTrailingSlashRedirect: true` is required — otherwise Next.js issues a 308 redirect from `/api/__relay/i/v0/e/` to `/api/__relay/i/v0/e` before the rewrite, breaking ingestion.

**Why `/api/__relay` instead of `/ingest`:** modern ad-blockers (uBlock Origin, AdBlock Plus, Brave Shield, Privacy Badger) maintain rules that match common analytics endpoint names — `ingest`, `track`, `analytics`, `e/`, `decide` — even on first-party domains. Requests get blocked at the browser extension layer with status `(blocked:other)`, never reaching the network. By disguising the proxy as an internal API path (`/api/__relay/*`), we avoid these heuristic blocks. The `__` prefix is a common convention for "internal" endpoints and is not on adblocker filter lists.

**Middleware compatibility:** because the proxy path lives under `/api/*`, it is automatically excluded from the next-intl middleware matcher (`/((?!api|_next|_vercel|.*\\..*).*)`). No middleware changes needed. If you ever rename the proxy off `/api/*`, you must update the matcher to exclude the new prefix, otherwise next-intl will redirect proxy requests to `/vi/...` and break ingestion.

### 3.2. Manual pageview for App Router
The App Router uses soft client-side navigation (Link, router.push) — no full document load fires, so PostHog's auto-pageview misses every soft navigation. Solution: `PageviewTrackerInner` listens to `usePathname()` + `useSearchParams()` and fires `$pageview` on every URL change.

### 3.3. Suspense boundary for `useSearchParams`
`useSearchParams()` opts the entire page into dynamic rendering. We wrap `PageviewTrackerInner` in `<Suspense>` so the bailout is scoped to this subtree only — static rendering is preserved for the rest of the app.

### 3.4. Singleton init
PostHog `init()` is not idempotent. React Strict Mode + locale segment switches can re-mount the provider, so we guard with a module-level `initialized` flag.

### 3.5. Locale property on pageview
We extract the locale from the first path segment (`/vi/movies/foo` → `vi`) and attach it to every pageview, so PostHog dashboards can break down by VI vs EN with no extra setup.

### 3.6. Identify strategy (Phase 3 — upcoming)
The project has no global `onAuthStateChanged` listener. Auth state lives in **Redux + redux-persist**. Plan: subscribe to `state.auth.user`:
- `null → object` → `posthog.identify(uid, { email, name })`
- `object → null` → `posthog.reset()`
- Also covers redux-persist rehydration on page reload

---

## 4. Config

### 4.1. Env vars
```bash
# .env
NEXT_PUBLIC_POSTHOG_KEY="phc_xxxxxxxxxxxxxxxx"   # Project API key (from PostHog UI)
NEXT_PUBLIC_POSTHOG_HOST="/api/__relay"               # Reverse proxy path
NEXT_PUBLIC_POSTHOG_UI_HOST="https://us.posthog.com"
```

> Region: if the PostHog project is in **EU** instead of US, update two places in `next.config.mjs`: `us.i.posthog.com` → `eu.i.posthog.com`, `us-assets.i.posthog.com` → `eu-assets.i.posthog.com`.

### 4.2. Active SDK options
| Option | Value | Reason |
|---|---|---|
| `capture_pageview` | `false` | Manual capture for App Router |
| `capture_pageleave` | `true` | Accurate time-on-page |
| `persistence` | `'localStorage+cookie'` | Best persistence across tabs / sessions |
| `autocapture` | `true` | Free click/submit tracking, can disable later if noisy |
| `session_recording.maskAllInputs` | `true` | Mask passwords / comment drafts |
| `session_recording.maskTextSelector` | `'[data-private]'` | Custom selector for sensitive elements |

---

## 5. Roadmap

| Phase | Status | Description |
|---|---|---|
| 1. Setup | Done | Deps, env, reverse proxy |
| 2. Init client + provider + pageview | Done | `lib/posthog/client.ts`, `PostHogProvider`, mounted in tree |
| 3. Auth identify | Pending | Redux subscriber → `identify` / `reset` |
| 4. Event schema + tracking points | Pending | Watch funnel, search, collection, comment, auth |
| 5. Privacy & GDPR | Pending | Cookie consent / cookieless mode |
| 6. Verify & dashboard | Pending | Test events, build PostHog dashboards |

---

## 6. Event schema (Phase 4 — upcoming)

| Event | Properties | Trigger |
|---|---|---|
| `$pageview` | `$current_url`, `locale` | Auto, on every route change |
| `$pageleave` | (auto) | Tab close / navigate away |
| `movie_viewed` | `movie_id`, `slug`, `title`, `type`, `genre`, `country`, `year` | Movie detail page mount |
| `movie_play_started` | `movie_id`, `episode`, `server` | First `play` event of the video |
| `movie_play_progress` | `movie_id`, `percent` (25/50/75/95) | Throttled milestone |
| `movie_play_completed` | `movie_id`, `watch_duration` | `ended` event |
| `episode_switched` | `movie_id`, `from`, `to` | Click on a different episode |
| `server_switched` | `movie_id`, `from`, `to` | Click on a different server |
| `resume_accepted` / `resume_rejected` | `movie_id`, `position` | User responds to resume prompt |
| `search_performed` | `query`, `results_count` | Search results returned |
| `collection_added` / `collection_removed` | `movie_id` | Click add / remove button |
| `comment_posted` | `movie_id`, `comment_length` | Comment submitted successfully |
| `auth_signup` | `method` (`'email'` / `'google'`) | Signup success |
| `auth_login` | `method` | Login success |
| `auth_logout` | (no props) | Logout button |

---

## 7. Troubleshooting

### 7.1. Request shows `(blocked:other)` in Network tab — no status code
**This is an ad-blocker / browser extension blocking the request.** Most common offenders: uBlock Origin, AdBlock Plus, Brave Shield, Ghostery, Privacy Badger. They use content-based heuristics that match analytics endpoint names (`ingest`, `track`, `e/`, `decide`) and PostHog API key patterns (`phc_`) even on first-party domains.

**Confirmation:** open Chrome Incognito (Ctrl+Shift+N) → reload the page. If requests succeed in Incognito, an extension is the cause.

**Fix (already applied):** the proxy path is set to `/api/__relay/*` instead of `/ingest/*` — adblocker rules don't match it. If you ever see `blocked:other` again on a different path, rename it to something more obscure and update both `next.config.mjs` rewrites and `NEXT_PUBLIC_POSTHOG_HOST` in `.env`.

### 7.2. Request returns 308 redirect / 404 / wrong locale prefix
**Cause:** next-intl middleware in `middleware.ts` is intercepting the proxy path before the rewrite runs. It redirects to `/vi/api/__relay/*` which doesn't match any rewrite → 404.

→ The middleware matcher already excludes `api`, so `/api/__relay/*` is safe. If you rename the proxy off `/api/*`, you MUST add the new prefix to the matcher exclusion list:
```ts
matcher: ['/((?!api|_next|_vercel|<your-prefix>|.*\\..*).*)'],
```

### 7.3. Request returns 5xx and `retry_count` keeps growing
**Cause #1:** dev server hasn't picked up the new `next.config.mjs`.
→ Kill `npm run dev`, restart.

**Cause #2:** browser cached the old PostHog bundle.
→ Hard refresh `Ctrl+Shift+R`. Or DevTools → Network → tick "Disable cache".

**Cause #3:** region mismatch.
→ Open PostHog UI → Project Settings → check region (US/EU). Update `next.config.mjs` to match.

**Cause #4:** missing or wrong API key.
→ Verify `.env` has `NEXT_PUBLIC_POSTHOG_KEY="phc_..."` (quoted, no stray whitespace). Restart dev server after editing env.

### 7.2. No events appear in PostHog UI
1. DevTools → Network → filter `ingest` → confirm requests with status 200
2. PostHog UI → Activity → Live events (5-10s delay)
3. Check console for `[PostHog.js]` logs (dev mode auto-enables `posthog.debug()`)

### 7.3. Build fails with "useSearchParams() should be wrapped in a suspense boundary"
→ `PageviewTrackerInner` is already wrapped in `<Suspense>` in `PostHogProvider.tsx`. If the error points to a different file, that file needs its own Suspense — unrelated to PostHog.

### 7.4. Pageview fires twice on a single navigation
→ React Strict Mode mounts components twice in dev. Production fires only once. You can disable Strict Mode in dev but it's NOT recommended — Strict Mode catches many other bugs.

### 7.5. `locale` is missing from `$pageview`
→ Check the `pathname` from `usePathname()` is shaped like `/vi/...`. If not (e.g. misconfigured `next-intl`), the tracker can't extract it. Verify `i18n/routing.ts` has `localePrefix: 'always'`.

---

## 8. Local testing

```bash
# 1. Restart dev server (required after editing next.config.mjs)
npm run dev

# 2. Open http://localhost:3000/vi in a browser
# 3. DevTools → Network → filter "ingest"
#    - Should see /api/__relay/decide or /api/__relay/flags request (config check)
#    - Should see /api/__relay/i/v0/e/ requests (event ingestion) on navigation

# 4. DevTools → Console
#    - Should see [PostHog.js] ... logs (debug mode auto-enabled in dev)

# 5. PostHog UI → Activity → Live events
#    - $pageview event appears after 5-10s
```

---

## 9. References

- [PostHog Next.js docs](https://posthog.com/docs/libraries/next-js)
- [PostHog event spec (`$pageview`, `$autocapture`)](https://posthog.com/docs/data/events)
- [Session replay config](https://posthog.com/docs/session-replay/installation)
