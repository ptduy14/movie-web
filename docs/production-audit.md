# Production Readiness Audit — Movie Streaming Platform

> Full-codebase audit of the OPhim-backed Next.js 14 streaming app, benchmarked against the production bar of Netflix / Apple TV+ / Amazon Prime Video. Goal: a prioritized, evidence-backed path from "feature-rich hobby project" to "secure, stable, professional product."

**Status:** audit complete — recommendations not yet actioned
**Owner:** _(unassigned)_
**Last updated:** 2026-06-11
**Scope:** entire repository (data layer, auth/security, features/UX, SEO/perf/a11y/i18n, production engineering)

**Severity legend:** 🔴 Critical (blocks production) · 🟠 High (stability/reliability) · 🟡 Medium (polish/SEO/perf) · 🟢 Enhancement (feature parity)

---

## 0. Verdict (TL;DR)

The codebase is **more mature and feature-complete than a typical side project**: a custom HLS player, full vi/en i18n (287/287 key parity), cross-device continue-watching, an AI translation pipeline, a trending cron, and real-time comments/notifications. The technical foundation is solid.

However, it is **not yet production-grade**, for two reasons that have nothing to do with features:

1. **A cluster of critical security flaws** that, combined, allow full-database compromise and cross-user data tampering (IDOR).
2. **Missing baseline operational infrastructure** — no tests, no CI gate, no error tracking, no catalog caching, no error boundaries.

The "make it like Netflix/Apple" work (recommendations, richer discovery) is the *easiest* remaining layer. The hard, blocking work is **security and stability**. This doc orders the work accordingly:

🔴 **Layer 0 — Production blockers (security)** → 🟠 **Layer 1 — Stability** → 🟡 **Layer 2 — SEO/Performance** → 🟢 **Layer 3 — Feature roadmap.**

---

## 1. Audit method

Five independent read-only passes over the codebase, each owning one domain, cross-checked for agreement:

| Pass | Domain |
|---|---|
| A | Data layer, caching, OPhim/TMDB/Groq integrations, API & cron routes |
| B | Auth, session/cookies, Firestore authorization, secrets |
| C | Feature set & UX completeness vs major streaming platforms |
| D | SEO, rendering/performance, images, accessibility, i18n |
| E | Production engineering — testing, CI/CD, observability, headers, config |

All findings below cite `file:line` evidence. The most severe findings (secrets exposure, authorization) were independently surfaced by **multiple** passes.

---

## 2. 🔴 Layer 0 — Production blockers (security)

These must be fixed before any production deploy. They are not theoretical — each is a concrete, exploitable path.

| # | Finding | Evidence | Impact |
|---|---|---|---|
| S1 | **Firebase Admin service-account key named `NEXT_PUBLIC_FIREBASE_CREDENTIALS_BASE64`** | `lib/firebase-admin.ts:7`, `README.md:195`, `scripts/migrate-firestore-collections.js:34` | `NEXT_PUBLIC_` is inlined into the client bundle by Next.js. `firebase-admin` is currently imported **server-side only**, so it may not be bundled *today* — but this is a latent critical exposure: one client import leaks a full admin private key that **bypasses all security rules** = total Firestore compromise. |
| S2 | **No Firestore Security Rules in repo; all user writes happen client-side, keyed on a client-supplied `uid`** | `services/firebase-services.ts:106-126` (edit/delete comment take **no uid**), `:304-315` (progress), `components/buttons/btn-add-to-collection.tsx:63-126`; owner check is UI-only at `components/comment/comment-control.tsx:35` | **System-wide IDOR**: user A can read/modify/delete user B's comments, collections, watch progress, and notifications. Client-side `uid` checks are cosmetic. |
| S3 | **`/api/progress/sync` performs Admin-SDK writes with no authentication, taking `userId` from the request body** | `app/api/progress/sync/route.ts:18-35` | Any unauthenticated caller can overwrite **any** user's progress and write unbounded documents (quota/cost abuse). Admin SDK bypasses rules. |
| S4 | **Auth cookie is set from an unverified client-supplied token; middleware only checks cookie *presence*** | `app/api/auth/set-auth-cookie/route.ts:15-16` (no `verifyIdToken`), `middleware.ts:30` (`cookies.has('accessToken')`) | An attacker who sets any non-empty `accessToken` cookie passes the "protected route" gate. Auth gating is effectively fake. |
| S5 | **TMDB v4 access token named `NEXT_PUBLIC_TMDB_ACCESS_TOKEN`** | `services/tmdb-services.ts:12,38` | Long-lived secret shipped to the browser. |

### Supporting weaknesses (same domain)

- **Missing `sameSite` on auth cookies** (`set-auth-cookie/route.ts:9-13`) — weakens CSRF posture. The locale cookie correctly sets `sameSite:'lax'` (`middleware.ts:50`).
- **Logout via `GET`** (`logout/route.ts:3`, `remove-auth-cookie/route.ts:3`) — state-changing GET enables logout CSRF.
- **No server-side validation on the signup API** — zod runs client-only; `app/api/auth/signup/route.ts:8-17` trusts the raw body and stores `name` unsanitized. Raw Firebase `error.code`/`message` returned to client (`:27-34`).
- **No rate limiting / brute-force protection** on signup or login. `lib/upstash.ts` exists (could host `@upstash/ratelimit`) but is used only for TMDB image caching.
- **Comment content unvalidated/unsanitized** (`components/comment/comment-input.tsx:35`, stored raw in `firebase-services.ts:93`) — verify the render path is not XSS-prone.
- **Token lifecycle mismatch** — 30-day cookie `maxAge` (`set-auth-cookie/route.ts:12`) vs ~1h Firebase ID token; no refresh flow.
- **`/profile` not protected** — absent from `middleware.ts:7` `PROTECTED_PATHS`; `app/[locale]/profile/page.tsx` has no server gate.

### P0 recommendations
1. **Rotate** both the Firebase service-account key (project `moviex-ad32a`) and the TMDB token — treat them as already compromised.
2. **Rename** env vars to drop `NEXT_PUBLIC_` (e.g. `FIREBASE_CREDENTIALS_BASE64`, `TMDB_ACCESS_TOKEN`); update `lib/firebase-admin.ts:7`, `services/tmdb-services.ts:12,38`, `README.md`, `scripts/migrate-firestore-collections.js`.
3. **Author & deploy `firestore.rules`** (commit `firestore.rules` + `firebase.json`): gate `users/{uid}`, `userMovies/{uid}`, `recentMovies/{uid}/...`, `userNotifications/{uid}/...` on `request.auth.uid == uid`; gate `movieComments/.../comments/{c}` on `resource.data.userId == request.auth.uid`.
4. **Authenticate `progress/sync`**: require a Firebase ID token, `verifyIdToken`, derive `userId` from the token (ignore body), add per-user rate limit, validate/clamp the `movie` payload.
5. **Verify the ID token in `set-auth-cookie`** (Admin SDK) before setting the cookie; prefer issuing a **session cookie** via `admin.auth().createSessionCookie`. Make middleware verify, not just check presence. Add `/profile` to protected paths.
6. Add `sameSite`, convert logout/remove-cookie to POST, validate signup server-side, rate-limit auth (reuse Upstash).

---

## 3. 🟠 Layer 1 — Stability & reliability

| Finding | Evidence | Impact |
|---|---|---|
| **Catalog has no caching** — every list call is `cache:'no-store'`; no page declares ISR | `services/movie-services.ts:5,18,24,31,38,45` | OPhim is a hard runtime dependency on every render. If `ophim1.com` is slow/down, **every page is slow or 500s**. No stale-while-revalidate, no graceful degradation. Biggest reliability gap. |
| **No timeouts/retries on any external fetch** | all of `services/movie-services.ts`, `tmdb-services.ts`, Groq SDK, `scripts/fetch-trending.mjs` | A hung upstream socket holds a serverless slot to the function ceiling. No backoff on transient 5xx/429. |
| **Core data layer has no `res.ok` check / try-catch** | `services/movie-services.ts:1-84` (1 guard in the whole file) | A non-2xx or HTML error page from OPhim throws inside `res.json()` or returns garbage to consumers. |
| **No React error boundaries anywhere** — no `error.tsx`, `global-error.tsx`, `not-found.tsx` | entire `app/` tree | Any render/data throw → default crash screen, no recovery. Bad slugs `redirect('/')` (`movies/[slug]/page.tsx:53`) instead of a real 404 (bad for SEO). |
| **Zero automated tests** (no Jest/Vitest/Playwright/Cypress) | `package.json:5-12` | No guard for auth, progress, player, translation. |
| **No CI gate** — only two cron workflows; nothing runs lint/typecheck/build on push/PR | `.github/workflows/*` | Broken builds can merge to `main`. |
| **No error tracking / structured logging** (no Sentry) | grep across repo | Server failures vanish into `console.error` (~16 files). No alerting. |
| **No security headers / CSP** despite embedding external HLS + YouTube iframes | `next.config.mjs` | No clickjacking protection, no `frame-src`/`media-src`/`connect-src` allowlist. |
| **Module-level mutable state** — `let movie` shared across requests | `app/[locale]/movies/watch/[slug]/page.tsx:8,15` | Concurrent requests clobber it → wrong/cross-request metadata. The sibling `movies/[slug]/page.tsx:18-20` explicitly warns against this pattern. |
| **AI translation can add LLM latency to SSR** — cache miss triggers a synchronous Groq call during render; no Groq 429/backoff handling in cron | `services/movie-content-localizer.ts:63`, `services/cron-translation-service.ts:286-295` | First render for a locale waits on the model; a Groq 429 wastes a whole cron page. |

### P1 recommendations
1. **Shared fetch wrapper** in `MovieServices`/`TMDBServices`: `res.ok` check + `AbortController` timeout (5–8s) + retry-with-backoff for 5xx/429 + typed errors. All endpoints inherit it.
2. **Cache the catalog**: lowest-effort = switch list calls to `next:{revalidate:60–300}` + add `export const revalidate` to catalog pages (ISR, stale-while-revalidate). Higher bar = read-through Upstash cache mirroring `services/tmdb-images-cache.ts` so OPhim downtime serves stale instead of 500. De-dupe the double `/v1/api/home` fetch between metadata and the home component.
3. Add `app/global-error.tsx`, `app/[locale]/error.tsx`, `app/[locale]/not-found.tsx` with retry/home UX; return real 404s for bad slugs.
4. Add `.github/workflows/ci.yml`: `npm ci && npm run lint && npx tsc --noEmit && npm run build` on push + PR. Highest-leverage gate; needs no test suite to exist first.
5. Integrate `@sentry/nextjs` (client + server + edge) with source maps; alert cron failures (Sentry cron monitors or a Slack webhook on workflow failure).
6. Add `async headers()` to `next.config.mjs`: HSTS, `X-Content-Type-Options:nosniff`, `Referrer-Policy`, `X-Frame-Options`/`frame-ancestors`, and a CSP allowlisting YouTube, the HLS host, PostHog, Firebase.
7. Fix `watch/[slug]/page.tsx`: fetch inside `generateMetadata` locally (remove module `let`); make redirects locale-aware.
8. Move on-demand translation to "serve original now, translate in background (cron is the only writer)"; add Groq 429 backoff + concurrency caps + output validation (HTML tag-count, non-empty) before caching.

---

## 4. 🟡 Layer 2 — SEO, performance, accessibility, i18n

This is a **discovery-driven content site**, so SEO is not optional polish — it is a primary growth channel.

### SEO

| Finding | Evidence |
|---|---|
| **No sitemap, no robots** | missing `app/sitemap.ts`, `app/robots.ts` — Google cannot efficiently crawl movie pages |
| **No structured data (JSON-LD `Movie`/`VideoObject`/`BreadcrumbList`)** | movie detail pages have none → no rich results |
| **Canonical + hreflang only on home** | every other page omits `alternates.canonical`/`languages` → `/vi` vs `/en` duplicate-content risk on the highest-value (movie detail) pages |
| **Hardcoded Vietnamese metadata + stale "2024"** on watch/country/format/type | `country/[slug]/page.tsx:10-13`, `format/[slug]/page.tsx:9-12`, `type/[slug]/page.tsx:9-12`, `watch/[slug]/page.tsx:19` (today is 2026) |
| **No OpenGraph/Twitter image** on movie detail (the most-shared URL) | `movies/[slug]/page.tsx:39-42` — no card image from `poster_url`/`thumb_url` |
| **No `metadataBase`** | relative OG/canonical URLs won't resolve to absolute; no `opengraph-image`/`manifest`/themed icons |

### Rendering & performance

| Finding | Evidence |
|---|---|
| **`setRequestLocale` missing on most pages** → next-intl falls back to dynamic rendering, defeating SSG/ISR | present only in `app/[locale]/layout.tsx:43`, `movies/[slug]/page.tsx:49`; **home lacks it** (`app/[locale]/page.tsx`) |
| **No explicit ISR/SSG** — no `export const revalidate`/`dynamic` on any `[locale]` page | every movie page re-fetches OPhim + TMDB + AI-translation per request |
| **No Suspense streaming** — server components await all data before returning; one full-screen `loading.tsx` | `movies/[slug]/page.tsx:48-90` awaits detail → images → credits → logo **sequentially** (should `Promise.all`) |
| **`images.unoptimized: true`** disables all next/image optimization (resize, AVIF/WebP, srcset) | `next.config.mjs:10` — major bandwidth/LCP cost on a poster-grid site; `sizes="100%"` is also invalid (`regular-movie-item.tsx:46`) |
| **LCP image unoptimized & unprioritized** — desktop hero is a CSS `background-image` (un-preloadable); mobile poster is a raw `<img>` with no dimensions → CLS | `components/commons/hero-movie-item.tsx:100,189` |
| **No `next/font`** | FOUT/CLS risk |

### Accessibility

| Finding | Evidence |
|---|---|
| **Auth modal not accessible** — no `role="dialog"`/`aria-modal`/`aria-labelledby`, no Escape, no focus trap; backdrop is a clickable `<div>` | `components/auth/auth-modal.tsx:46-52` |
| **Low contrast** on secondary text (`text-white/40–60`, `text-gray-400` on near-black) fails WCAG AA | `hero-movie-item.tsx:143,242,249` |
| **`prefers-reduced-motion` only partial** — handled in loading spinners; carousels, hero, modal animations ignore it | `loading-component.tsx:5` (good); `auth-modal.tsx:52` (ignored) |

### i18n

- **Strong baseline:** 287/287 key parity across `messages/en.json` / `messages/vi.json`; locale routing in `middleware.ts` is well structured.
- **Leaks:** three profile components hardcode Vietnamese with **no `useTranslations`** — an `en` user sees these in Vietnamese: `components/profile/security-settings.tsx` (~30 strings), `components/profile/support-contact.tsx` (~40), `components/profile/profile-sidebar.tsx` (nav/toasts).

### P1–P2 recommendations
- Add `app/sitemap.ts`, `app/robots.ts`, `metadataBase`; add `alternates.canonical` + `languages` to every page's `generateMetadata`; add JSON-LD to movie detail/watch; add `openGraph.images` from poster/thumb; localize + de-stale watch/country/format/type metadata.
- Add `setRequestLocale(locale)` to all `[locale]` pages; declare per-route `revalidate`; `Promise.all` the detail awaits; add `<Suspense>` with the existing skeletons.
- Set `images.unoptimized:false`, fix `sizes`, add `priority` to the hero LCP image and convert it to `next/image` with a fixed aspect ratio.
- Internationalize the three profile components; make the auth modal/dropdowns accessible; raise secondary-text contrast; gate animations behind `prefers-reduced-motion`; adopt `next/font`.

---

## 5. 🟢 Layer 3 — Feature roadmap (Netflix / Apple TV+ / Amazon parity)

### What already exists (strengths)

| Feature | Completeness | Note |
|---|---|---|
| Custom HLS player | 85% | Keyboard shortcuts, gestures, lock screen, speed, server-as-language, next-episode autoplay card, resume prompt |
| Continue watching | 90% | **Most mature feature** — cross-device via Firestore (`recentMovies/{uid}`), guest localStorage fallback, multi-cadence persistence + `sendBeacon` |
| Hero carousel | 90% | TMDB logo art, IMDb/TMDB ratings, badges, AI-translated synopsis |
| Movie detail | 80% | Bilingual title, ratings w/ links, cast, stills gallery, trailer, comments — **but no related/similar row** |
| Browse by type/genre/country/format | 80% | Infinite scroll, skeletons — **no in-page sort/filter** |
| Watchlist ("Collection") | 70% | Flat list, no named lists/sort |
| Comments | 65% | Post/edit/delete/like — **Reply is a non-functional stub** (`comment-control.tsx:55`) |
| Notifications | 55% | Real-time, unread count — **"Mark all read" is a `console.log` stub** (`notification-dropdown.tsx:50`); only like/reply events |
| Profile | 60% | **Avatar upload non-functional** (`personal-info.tsx:81`), **fake 2FA card**, **mock support form** |
| **Recommendations / personalization** | **0%** | None anywhere — the single biggest gap |

### Search (45%)
Title-only, capped at 15 results (`movie-services.ts:76-81`), no filters/facets, no autocomplete, no history. **Both the empty (no-query) and zero-result states render the same `BrandingPlaceholder`** (`search/index.tsx:49`) — confusing; no "No results for X" message.

### Recommended features (prioritized)

**Tier 1 — high impact, low effort (data already available):**
1. **"More Like This" / related row on the detail page** — query the title's first category via `getMoviesType`/`getMoviesCountry` (already exist), render with `MovieList`. Closes Netflix's single most-used pattern. Goes where `movie-content.tsx` currently ends (`:54-84`).
2. **Genre rows on the home page** — turns 5 generic feeds into a browsable surface; reuses existing components (`home/index.tsx:32`).
3. **Proper search empty/zero-result state** — distinct "No results for '{query}'" + suggested popular titles (`search/index.tsx:49`).
4. **Finish the broken stubs** (they read as bugs): "Mark all as read" (`notification-dropdown.tsx:50`), the fake Reply affordance (`comment-control.tsx:55`), avatar upload (`personal-info.tsx:81`), 2FA card, support form.
5. **Make cast clickable → filmography** (`actor-item.tsx` already has TMDB ids).

**Tier 2 — high impact, medium effort:**
6. **"Because you watched" rail** — derive genres from the Firestore `recentMovies`/`userMovies` already stored; first real personalization without new infra.
7. **Search filters/facets** (genre, country, year, type) + sort — OPhim browse endpoints support these dimensions.
8. **Live trending** instead of build-time `public/data/trending.json` (promote to ISR/cron-refreshed).
9. **User ratings (thumbs)** + **Share** (Web Share API) — small new Firestore fields.

**Tier 3 — platform-defining, higher effort:**
10. **Multiple user profiles** (sub-accounts under one auth) — large data-model change; a core Netflix/Prime expectation.
11. **Maturity ratings + Kids mode / parental PIN** — needs an age-rating source (TMDB certifications; OPhim lacks it).
12. **Hover autoplay previews** on cards.

### Explicitly NOT feasible (blocked by OPhim data — see `docs/custom-video-controls.md` §15 and the OPhim memory note)
Quality selector, selectable subtitle tracks, custom subtitle styling, true multi-audio in-stream switch, skip-intro/recap chapter UI. These require a different content source or a custom ingest/re-encode pipeline. The current "server = language" switch is the correct workaround.

---

## 6. Phased plan

```
Sprint 1 — BLOCKER (security):  rotate keys → rename env (drop NEXT_PUBLIC_) →
                                firestore.rules → verify ID tokens (progress/sync,
                                set-auth-cookie, middleware) → protect /profile
Sprint 2 — STABLE:              shared fetch wrapper (res.ok + timeout + retry) →
                                ISR / Upstash cache for catalog → error.tsx /
                                not-found.tsx / global-error.tsx → CI gate → Sentry →
                                security headers + CSP → fix watch/[slug] module state
Sprint 3 — SEO / PERF:          sitemap + robots + metadataBase → canonical/hreflang +
                                JSON-LD on all pages → images.unoptimized:false +
                                priority hero → setRequestLocale + revalidate →
                                i18n the 3 profile components
Sprint 4 — FEATURE:             More Like This → genre rows → search empty state +
                                filters → fix stubs (mark-all-read, replies, avatar) →
                                Because you watched
Sprint 5 — POLISH:              user ratings + share → live trending → a11y pass
                                (modal/contrast/reduced-motion) → (profiles / parental
                                controls if scope allows)
```

---

## 7. Appendix — file reference index

**Security:** `lib/firebase-admin.ts:7` · `app/api/auth/set-auth-cookie/route.ts:9-16` · `app/api/progress/sync/route.ts:18-35` · `middleware.ts:7,29-34` · `services/firebase-services.ts:106-126,304-315` · `components/comment/comment-control.tsx:35` · `components/buttons/btn-add-to-collection.tsx:63-126` · `app/api/auth/signup/route.ts:8-17` · `services/tmdb-services.ts:12,38` · (absent) `firestore.rules`

**Stability:** `services/movie-services.ts:1-84` · `app/[locale]/movies/watch/[slug]/page.tsx:8,15` · `services/movie-content-localizer.ts:63` · `services/cron-translation-service.ts:286-314` · `next.config.mjs` · `.github/workflows/*` · `package.json:5-12`

**SEO/perf/a11y/i18n:** `app/[locale]/page.tsx` · `app/[locale]/movies/[slug]/page.tsx:39-90` · `country|format|type/[slug]/page.tsx` · `next.config.mjs:9-12` · `components/commons/hero-movie-item.tsx:100,189` · `components/commons/regular-movie-item.tsx:46` · `components/auth/auth-modal.tsx:46-52` · `components/profile/security-settings.tsx` · `components/profile/support-contact.tsx` · `components/profile/profile-sidebar.tsx` · missing: `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`, `app/[locale]/error.tsx`, `app/[locale]/not-found.tsx`, `app/global-error.tsx`

**Features:** `components/home/index.tsx:32` · `components/movie/movie-content.tsx:54-84` · `components/search/index.tsx:49` · `components/notification/notification-dropdown.tsx:50` · `components/comment/comment-control.tsx:55` · `components/actor/actor-item.tsx` · `components/profile/personal-info.tsx:81` · `services/movie-services.ts:64-81`

---

## 8. Working references (existing strengths to mirror)

- **Read-through cache pattern done right:** `services/tmdb-images-cache.ts` + `lib/upstash.ts` (graceful null-degradation). Mirror this for the OPhim catalog.
- **Build-time pre-baking:** `scripts/fetch-trending.mjs` → `public/data/trending.json` (zero runtime TMDB calls). Good pattern.
- **Content-aware cache invalidation:** translation pipeline compares `sourceModifiedAt` vs OPhim `modified.time` (`services/movie-content-localizer.ts:52-54`).
- **Authenticated cron:** `app/api/translate/cron-batch/route.ts:38-45` (`Bearer CRON_SECRET`) — apply the same auth discipline to `progress/sync`.
- **i18n baseline:** 287/287 key parity — keep it green; just close the three profile leaks.
