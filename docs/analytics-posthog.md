# PostHog Analytics — Feature Doc

> Real-user traffic + product analytics tracking for movie-web.
> Single source of truth for every analytics decision. Updated after each phase.

**Status:** Phase 6/6 complete — implementation done, dashboards live

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
| `lib/posthog/events.ts` | Typed event wrapper (`analytics.movieViewed`, `analytics.authLogin`, ...) — single source of truth for event names + property shape |
| `components/analytics/PostHogProvider.tsx` | React provider + manual pageview tracker (App Router compat) |
| `components/analytics/AuthIdentifier.tsx` | Redux subscriber → `posthog.identify` on login, `posthog.reset` on logout |
| `hooks/useWatchAnalytics.ts` | Video lifecycle tracker (play / progress milestones / completed) |
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

### 3.6. Identify strategy
The project has no global `onAuthStateChanged` listener. Auth state lives in **Redux + redux-persist** (whitelist: `auth`), so we subscribe to `state.auth.user` from `AuthIdentifier`. Transitions:

| Previous | Current | Action |
|---|---|---|
| `null` | `object` | `posthog.identify(uid, { email, name })` — covers fresh login AND redux-persist rehydration on page reload |
| `object` | `null` | `posthog.reset()` — clears distinct_id on logout |
| `object A` | `object B` | `posthog.reset()` then `identify(B)` — defensive against rare account-switch without going through null |
| `null` / `object` | same | no-op |

State tracked via `useRef` to detect the transition without re-firing on unrelated re-renders.

**Why we identify on rehydration**: redux-persist restores `state.auth.user` from localStorage on app boot. Without re-calling `identify`, PostHog would treat the returning user as anonymous until they explicitly log in again. Re-identifying is idempotent — same `distinct_id` keeps the existing person profile.

**Privacy**: only `email` and `name` are sent as person properties. `accessToken` and `refreshToken` (also in the Redux user object) are explicitly NOT sent.

---

## 4. Config

### 4.1. Env vars
```bash
# .env
NEXT_PUBLIC_POSTHOG_KEY="phc_xxxxxxxxxxxxxxxx"   # Project API key (from PostHog UI)
NEXT_PUBLIC_POSTHOG_HOST="/api/__relay"          # Reverse proxy path
NEXT_PUBLIC_POSTHOG_UI_HOST="https://us.posthog.com"

# Optional — set "true" to enable PostHog in local dev. Default: disabled in
# dev so local browsing doesn't pollute production analytics.
NEXT_PUBLIC_POSTHOG_ENABLE_DEV="true"
```

**Dev behavior:** `initPostHog()` short-circuits when `NODE_ENV === 'development'` unless `NEXT_PUBLIC_POSTHOG_ENABLE_DEV=true`. When disabled, every `analytics.*()` call becomes a no-op (PostHog SDK methods are safe to call before `init()`). Console shows `[PostHog] disabled in dev` on app load — confirms the guard is active.

> Region: if the PostHog project is in **EU** instead of US, update two places in `next.config.mjs`: `us.i.posthog.com` → `eu.i.posthog.com`, `us-assets.i.posthog.com` → `eu-assets.i.posthog.com`.

### 4.2. Active SDK options
| Option | Value | Reason |
|---|---|---|
| `capture_pageview` | `false` | Manual capture for App Router |
| `capture_pageleave` | `true` | Accurate time-on-page |
| `persistence` | `'localStorage'` | No cookies → friendlier privacy story (see 5.1) |
| `autocapture` | `true` | Free click/submit tracking, can disable later if noisy |
| `respect_dnt` | `true` | Auto opt-out users with `Do Not Track` enabled |
| `disable_session_recording` | `isDev` | No replays in dev — saves 5K/month free quota for prod data |
| `session_recording.maskAllInputs` | `true` | Mask passwords / comment drafts |
| `session_recording.maskTextSelector` | `'[data-private]'` | Custom selector for sensitive elements |

---

## 5. Roadmap

| Phase | Status | Description |
|---|---|---|
| 1. Setup | Done | Deps, env, reverse proxy |
| 2. Init client + provider + pageview | Done | `lib/posthog/client.ts`, `PostHogProvider`, mounted in tree |
| 3. Auth identify | Done | Redux subscriber → `identify` / `reset` |
| 4. Event schema + tracking points | Done | Watch funnel, search, collection, comment, auth |
| 5. Privacy & GDPR | Done | localStorage-only, respect DNT, mask PII selectors |
| 6. Verify & dashboard | Done | Production verification + 7 dashboard insights live |

---

## 6. Event schema

All events are emitted via the typed wrapper in `lib/posthog/events.ts`. The wrapper is the single source of truth — to add or rename an event, update that file and the schema below in lockstep.

| Event | Properties | Trigger | Wrapper call | Source file |
|---|---|---|---|---|
| `$pageview` | `$current_url`, `locale` | Auto, on every route change | (built-in) | `components/analytics/PostHogProvider.tsx` |
| `$pageleave` | (auto) | Tab close / navigate away | (built-in) | (SDK) |
| `movie_viewed` | `movie_id`, `slug`, `title`, `type`, `genre[]`, `country[]`, `year` | Movie detail page mount | `analytics.movieViewed(...)` | `components/movie/index.tsx` |
| `movie_play_started` | `movie_id`, `episode`, `server` | First `play` event of the video | `analytics.moviePlayStarted(...)` | `hooks/useWatchAnalytics.ts` |
| `movie_play_progress` | `movie_id`, `percent` (25/50/75/95) | Throttled milestone via `timeupdate` | `analytics.moviePlayProgress(...)` | `hooks/useWatchAnalytics.ts` |
| `movie_play_completed` | `movie_id`, `watch_duration` (seconds) | `ended` event | `analytics.moviePlayCompleted(...)` | `hooks/useWatchAnalytics.ts` |
| `episode_switched` | `movie_id`, `from`, `to` | Click on a different episode | `analytics.episodeSwitched(...)` | `components/watch/index.tsx` |
| `server_switched` | `movie_id`, `from`, `to` | Click on a different server | `analytics.serverSwitched(...)` | `components/watch/index.tsx` |
| `resume_accepted` | `movie_id`, `position` | User accepts resume prompt | `analytics.resumeAccepted(...)` | `hooks/useVideoProgress.ts` |
| `resume_rejected` | `movie_id`, `position` | User rejects resume prompt | `analytics.resumeRejected(...)` | `hooks/useVideoProgress.ts` |
| `search_performed` | `query`, `results_count` | Search results returned | `analytics.searchPerformed(...)` | `components/search/index.tsx` |
| `collection_added` | `movie_id` | After Firestore write succeeds | `analytics.collectionAdded(...)` | `components/buttons/btn-add-to-collection.tsx` |
| `collection_removed` | `movie_id` | After Firestore write succeeds | `analytics.collectionRemoved(...)` | `components/buttons/btn-add-to-collection.tsx` |
| `comment_posted` | `movie_id`, `comment_length` | Comment submitted successfully | `analytics.commentPosted(...)` | `components/comment/comment-input.tsx` |
| `auth_signup` | `method` (`'email'` / `'google'`) | Signup success | `analytics.authSignup(...)` | `components/auth/signup-form.tsx` |
| `auth_login` | `method` | Login success (email or Google popup) | `analytics.authLogin(...)` | `components/context/auth-conext.tsx` |
| `auth_logout` | (no props) | Logout button click | `analytics.authLogout()` | `components/account/account-profile-dropdown.tsx`, `account-profile-mobile.tsx`, `profile/profile-sidebar.tsx` |

### 6.1. Watch lifecycle: `useWatchAnalytics`

`useWatchAnalytics` is a co-resident hook with `useVideoProgress` on the watch page. It attaches `play`, `timeupdate`, `ended` listeners to the same `videoRef` and tracks four milestones (25/50/75/95%) using a `Set<number>` ref to ensure each fires at most once per (movie + episode + server) combo. The hook resets internal state on episode/server change so multi-episode binge watching produces clean per-episode metrics.

`watch_duration` is computed as `Date.now() - playStartTimestamp` in seconds, which measures *real wall-clock time spent on the page* rather than video duration. This is more useful for engagement insights (counts paused / buffering time) — if a user watches a 90-min movie in 2 hours due to pauses, the metric reflects 2 hours.

### 6.2. Funnel insights this enables (build in PostHog UI in Phase 6)

- **Watch funnel**: `movie_viewed` → `movie_play_started` → `movie_play_progress (50%)` → `movie_play_completed` — measures top-of-funnel conversion and drop-off
- **Search quality**: `search_performed` → `movie_viewed` (with referrer = search) — measures whether searches lead anywhere
- **Signup conversion**: `$pageview` → `auth_signup` (group by `referrer`) — measures acquisition by source
- **Collection-driven retention**: cohort of `collection_added` users vs all users on D7/D30 retention

---

### 6.3. Privacy & PII strategy (Phase 5)

The audience is primarily Vietnamese, where there is no GDPR-equivalent cookie-consent law as of 2026. To stay clean of EU compliance overhead without needing a banner, we use a no-cookie tracking strategy plus aggressive PII masking in session replay.

### 6.3.1. No cookies — `persistence: 'localStorage'`
PostHog's default `localStorage+cookie` persistence sets a `ph_*_posthog` cookie. Cookies trigger ePrivacy Directive consent rules in the EU (and increasingly in other jurisdictions). Switching to `localStorage` only:
- Returning visitors are still tracked (localStorage persists indefinitely on the same browser)
- Logged-in users still get cross-device identity via `posthog.identify()` with their Firebase `uid`
- We lose cross-subdomain tracking — not relevant for movie-web (single domain)
- We avoid the EU consent banner requirement under the ePrivacy Directive

### 6.3.2. Respect `Do Not Track`
`respect_dnt: true` makes PostHog auto-opt-out users whose browser sends `DNT: 1`. Their events are dropped client-side and never reach the proxy. This is a cheap way to honor a user's explicit privacy preference at zero implementation cost.

### 6.3.3. Session replay masking
Two layers of masking:

**Layer 1 — `maskAllInputs: true`**: every `<input>`, `<textarea>`, `<select>` is auto-masked. Passwords, signup forms, search queries — all redacted to `*` in the replay. Default-on, never opt-out.

**Layer 2 — `data-private` attribute**: anything not an input but still PII gets the `data-private` attribute, picked up by `maskTextSelector`. Currently applied to:

| Element | File | Why |
|---|---|---|
| Comment input value | `components/comment/comment-input.tsx` | User-generated content may contain PII |
| Comment edit input | `components/comment/comment.tsx` | Same |
| Comment text display | `components/comment/comment.tsx` | Render of stored comment text |
| Profile email field | `components/profile/personal-info.tsx` | User email |
| Sidebar name + email | `components/profile/profile-sidebar.tsx` | User PII in nav |
| Account dropdown name + email | `components/account/account-profile-dropdown.tsx` | Same |
| Mobile menu name + email | `components/account/account-profile-mobile.tsx` | Same |

Adding more masks: drop `data-private` on any element whose text we don't want recorded. No code changes needed — the selector picks it up automatically.

### 6.3.4. PII NOT sent to PostHog
- `accessToken` / `refreshToken` (in Redux user object) — explicitly excluded from `posthog.identify`
- Passwords — auto-masked by `maskAllInputs` in replay, never captured as event property
- Full comment text — only `comment_length` is sent as a property; the text itself is not
- IP address — PostHog stores `$geoip_country_name` / `$geoip_city_name` derived from IP; the raw IP is hashed and stored only by PostHog (configurable in PostHog UI → Project Settings → Anonymize IP)

### 6.3.5. Dev-mode session recording disabled
`disable_session_recording` is set to `process.env.NODE_ENV === 'development'`. Local development sessions (debugging, hot reloads, fast refreshes) would otherwise burn through the 5K/month free quota with low-value recordings. Production keeps recording at full sampling — adjust in PostHog UI → Settings → Recordings → Sampling if it consumes too much quota.

### 6.3.6. What we did NOT add (deliberately)
- **No cookie consent banner** — moot since we don't set cookies
- **No PostHog feature flag for opt-out** — `respect_dnt` covers the use case without UI
- **No PostHog SDK loaded conditionally on user opt-in** — over-engineering for current audience

If the audience expands to EU users, the right next step is a CMP (consent management platform) like Cookiebot or Osano that gates `initPostHog()` on consent. The current architecture (singleton init function) is already structured to make that swap easy: just wrap `initPostHog()` in a consent check.

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

### 7.4. No events appear in PostHog UI
1. DevTools → Network → filter `ingest` → confirm requests with status 200
2. PostHog UI → Activity → Live events (5-10s delay)
3. Check console for `[PostHog.js]` logs (dev mode auto-enables `posthog.debug()`)

### 7.5. Build fails with "useSearchParams() should be wrapped in a suspense boundary"
→ `PageviewTrackerInner` is already wrapped in `<Suspense>` in `PostHogProvider.tsx`. If the error points to a different file, that file needs its own Suspense — unrelated to PostHog.

### 7.6. Pageview fires twice on a single navigation
→ React Strict Mode mounts components twice in dev. Production fires only once. You can disable Strict Mode in dev but it's NOT recommended — Strict Mode catches many other bugs.

### 7.7. `locale` is missing from `$pageview`
→ Check the `pathname` from `usePathname()` is shaped like `/vi/...`. If not (e.g. misconfigured `next-intl`), the tracker can't extract it. Verify `i18n/routing.ts` has `localePrefix: 'always'`.

---

### 7.8. Production verification checklist (Phase 6)

Run through this list once after the first prod deploy. Tick boxes by editing this file.

### Smoke test (5 min)
- [ ] Open production URL in regular browser → DevTools → Network → filter `__relay`
- [ ] On page load: `/api/__relay/decide?v=3` returns **200**
- [ ] On navigation between pages: `/api/__relay/i/v0/e/` POSTs return **200**
- [ ] No `(blocked:other)` rows — if any, see Troubleshooting 7.1
- [ ] DevTools → Application → Cookies → no `ph_*_posthog` cookie (we use localStorage only)
- [ ] DevTools → Application → Local Storage → `ph_<key>_posthog` entry exists with a `distinct_id`

### Event verification (10 min)
Open PostHog UI → **Activity → Live events** (5-10s ingestion delay), then exercise each path on the prod site:

- [ ] Load home page → `$pageview` event with `locale: "vi"` or `"en"`
- [ ] Click into a movie → `movie_viewed` with `movie_id`, `slug`, `title`, `genre`, `country`, `year`
- [ ] Click Play / open watch page → `movie_play_started`
- [ ] Watch past 25% → `movie_play_progress` with `percent: 25`
- [ ] Watch to end → `movie_play_completed` with `watch_duration` (seconds)
- [ ] Switch episode → `episode_switched` with `from`, `to`
- [ ] Switch server → `server_switched`
- [ ] Refresh watch page after 1+ min played → resume prompt → click Yes → `resume_accepted`
- [ ] Same prompt → click No → `resume_rejected`
- [ ] Search → `search_performed` with `query`, `results_count`
- [ ] Add to collection → `collection_added`
- [ ] Remove from collection → `collection_removed`
- [ ] Post a comment → `comment_posted` with `comment_length`
- [ ] Sign up → `auth_signup` with `method: "email"` or `"google"`
- [ ] Log in → `auth_login` with method
- [ ] Log out → `auth_logout`

### Identity verification
- [ ] Logged-out → `distinct_id` is anonymous (UUID format, starts with `01`)
- [ ] After login → `distinct_id` becomes the Firebase `uid`
- [ ] PostHog UI → **People** → search by email → person profile shows `email` + `name` properties
- [ ] After logout → next event uses a NEW anonymous distinct_id (not the old uid)

### Session replay verification
- [ ] PostHog UI → **Session replays** → click a recent recording from prod
- [ ] Comment input shows `█████` (masked)
- [ ] Profile email/name shows `█████` (masked via `data-private`)
- [ ] Login/signup form values masked

---

## 8. Dashboard guide (Phase 6)

Build these 7 insights on PostHog UI. They cover traffic, geography, watch funnel, search quality, acquisition, and retention.

### 8.1. Daily Active Users (DAU)
**Insight type:** Trends
**Series:** unique users on `$pageview`
**Date range:** Last 30 days
**Display:** Line chart
**Use:** Top-line growth metric. Track week-over-week change.

### 8.2. Pageviews by Country
**Insight type:** Trends
**Series:** total events on `$pageview`
**Breakdown:** `$geoip_country_name`
**Display:** World map (or stacked bar)
**Use:** Geographic distribution. Confirms ~95%+ Vietnam audience or shows expansion.

### 8.3. Device & Browser breakdown
**Insight type:** Trends
**Series:** unique users on `$pageview`
**Breakdown:** `$device_type` (separate insight: `$browser`)
**Display:** Pie chart
**Use:** Mobile vs desktop ratio drives UX priorities. Browser breakdown catches surprise traffic from old IE/Safari versions.

### 8.4. Top Movies (by views)
**Insight type:** Trends
**Series:** total events on `movie_viewed`
**Breakdown:** `title`
**Display:** Horizontal bar, top 20
**Use:** Content popularity. Compare with `movie_play_started` breakdown to find "high-click, low-watch" movies — those are misleading thumbnails or trailers labeled as movies.

### 8.5. Watch Funnel (the most important insight)
**Insight type:** Funnel
**Steps (in order):**
1. `movie_viewed`
2. `movie_play_started`
3. `movie_play_progress` where `percent = 50`
4. `movie_play_completed`

**Conversion window:** 1 day
**Use:** Single most actionable metric. Drop-off between step 1→2 means thumbnail/CTA is weak. Drop-off 2→3 means buffering / quality issues. Drop-off 3→4 means content doesn't keep them. Each step's % is a different lever.

### 8.6. Search → Watch Funnel
**Insight type:** Funnel
**Steps:**
1. `search_performed`
2. `movie_viewed` (within 5 minutes)
3. `movie_play_started`

**Use:** Measures whether search actually leads anywhere. If step 1→2 is low, the result page UX is broken. If 2→3 is low, search is finding wrong results.

### 8.7. Retention cohort (D1 / D7 / D30)
**Insight type:** Retention
**Cohortizing event:** `$pageview` (first time)
**Returning event:** `$pageview`
**Period:** Day
**Use:** Stickiness. D1 retention <20% means the site doesn't deliver value on first visit. D30 >15% is strong for a free streaming site.

### 8.8. Optional — Collection-driven retention
**Insight type:** Retention with cohort filter
**Cohort filter:** users who fired `collection_added` at least once
**Returning event:** `$pageview`
**Use:** Test the hypothesis "users who use collection are more retained". If cohort retention is significantly higher than overall (8.7), promote the collection feature more.

### 8.9. Saving these as a Dashboard
After building each insight:
1. Click **Save** → name it descriptively (e.g., "Watch Funnel")
2. From the insight, click **Add to dashboard** → New dashboard "movie-web overview"
3. Once all 7 are added, share the dashboard via PostHog UI → Dashboard → Share → set permissions

---

## 9. Session replay sampling (PostHog UI)

Free tier = 5K recordings/month. With 100% sampling and modest traffic, this can run out fast.

PostHog UI → **Settings → Replay → Sampling**:
- **Recommended start:** 100% sampling for first 2 weeks → see what raw data looks like
- **After 2 weeks:** drop to 25-50% sampling. You don't need to watch every replay — you need representative ones.
- **Conditional rules:** prefer recording sessions that fired specific events (e.g., `movie_play_started`) over random sessions. Do this with **Conditional rules** in the same UI.

If you blow through the quota mid-month, replays just stop being recorded — events still flow normally.

---

## 10. Custom queries with HogQL

PostHog stores raw events in ClickHouse. The query UI is at **SQL editor** in the left sidebar. HogQL = SQL with PostHog conventions.

### Example: time-to-first-play per signup cohort
```sql
SELECT
  toDate(min(timestamp)) AS signup_day,
  avg(dateDiff('second', signup_ts, first_play_ts)) AS avg_seconds_to_play
FROM (
  SELECT
    person_id,
    min(if(event = 'auth_signup', timestamp, null)) AS signup_ts,
    min(if(event = 'movie_play_started', timestamp, null)) AS first_play_ts
  FROM events
  WHERE event IN ('auth_signup', 'movie_play_started')
  GROUP BY person_id
)
WHERE signup_ts IS NOT NULL AND first_play_ts > signup_ts
GROUP BY signup_day
ORDER BY signup_day
```

### Example: which countries have the worst watch completion rate
```sql
SELECT
  properties.$geoip_country_name AS country,
  countIf(event = 'movie_play_started') AS started,
  countIf(event = 'movie_play_completed') AS completed,
  round(countIf(event = 'movie_play_completed') / countIf(event = 'movie_play_started') * 100, 1) AS completion_pct
FROM events
WHERE event IN ('movie_play_started', 'movie_play_completed')
  AND timestamp > now() - INTERVAL 30 DAY
GROUP BY country
HAVING started > 50
ORDER BY completion_pct ASC
LIMIT 20
```

Bottom of the list = countries where playback fails most often → likely CDN / video host issue affecting that region.

---

## 11. Alerts (optional, lightweight)

PostHog UI → **Insight → Alerts → Add alert**. Two useful starter alerts:

1. **Drop in DAU**: alert if `$pageview` unique users drops >30% week-over-week → catches site outages
2. **Spike in errors**: alert if events with property `error_*` exceed N/hour — requires adding error event tracking, not in current schema

Alerts ship to email or Slack webhook. Free tier supports basic alerting.

---

## 12. Local testing

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

## 13. References

- [PostHog Next.js docs](https://posthog.com/docs/libraries/next-js)
- [PostHog event spec (`$pageview`, `$autocapture`)](https://posthog.com/docs/data/events)
- [Session replay config](https://posthog.com/docs/session-replay/installation)
