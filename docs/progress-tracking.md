# Watch Progress Tracking — Feature Doc

> Persists per-movie playback position so users can resume where they left off, and surfaces a "Continue Watching" rail on the home page.

**Status:** stable

---

## 1. Goals

| Need | Outcome |
|---|---|
| Resume the same episode/timestamp on revisit | Resume prompt at top of watch page (`"Continue from 20:34?"`) |
| Surface recently-watched titles for quick re-entry | Home-page "Tiếp Tục Xem" / "Continue Watching" carousel |
| Work for guests (no signup friction) | localStorage path, identical schema to Firestore |
| Survive login (guest history follows the user) | App-level sync on null → user transition |
| Survive multi-device | Firestore is source of truth for auth users |
| Free / near-free at 200 visits/day | Single Firestore collection, bounded write rate |

---

## 2. Stack & file map

| File | Role |
|---|---|
| `types/recent-movie.ts` | `IRecentMovie` — shared shape for both storage layers |
| `lib/recent-movies-storage.ts` | localStorage `rm` key: save / get / getOne / remove / clear |
| `services/firebase-services.ts` | Firestore CRUD: `getRecentMovies`, `getRecentMovie`, `updateWatchProgress`, `removeRecentMovie` |
| `hooks/useVideoProgress.ts` | Player-bound hook: save cadence + resume restore + force-sync events |
| `hooks/useGuestLoginSync.ts` | App-level effect: pushes localStorage → Firestore on login |
| `app/api/progress/sync/route.ts` | `sendBeacon` target — last-gasp save on tab close (auth only) |
| `components/home/continue-watching-section.tsx` | Home carousel — reads + delete handler |
| `components/recent/index.tsx` | `/movies/recent` page — same data, link to detail page |
| `components/commons/continue-watching-item.tsx` | Card UI — landscape thumb, progress bar, delete X, add-to-collection |
| `app/providers.tsx` | Mounts `useGuestLoginSync` in the Redux tree |

---

## 3. Data model

Single shape for both layers — `IRecentMovie`:

```ts
{
  id: string;                  // OPhim _id (== Firestore doc id, == localStorage key)
  slug: string;                // routing
  thumb_url: string;           // landscape 16:9 image
  name: string;
  origin_name: string;
  lang: string;                // "Vietsub" / "Lồng Tiếng" / ...
  quality: string;             // "HD" / "FHD"
  progressTime?: number;       // seconds watched
  progressEpIndex?: number;    // episode index
  progressEpLink?: string;     // m3u8 link of the episode
  progressDuration?: number;   // total episode duration (for % bar)
  updatedAt?: number;          // Date.now() ms — sort + conflict resolution
  userId?: string;             // Firestore only
}
```

Storage locations:
- **localStorage** key `rm` → `Record<movieId, IRecentMovie>`, LRU 10
- **Firestore** path `recentMovies/{userId}/movies/{movieId}`

There is **no** separate "progress-only" store. Resume prompt and Continue Watching both read this same shape. (Prior to 2026-05-16 consolidation we had parallel `vp` localStorage + `viewing_progress` Firestore — both removed.)

---

## 4. Write cadence (auth user, actively playing)

| Trigger | localStorage `rm` | Firestore `recentMovies` |
|---|:---:|:---:|
| 20s interval (player playing, `currentTime > 0`) | ✓ | — |
| 60s interval (player playing) | — | ✓ |
| `pause` event | ✓ | ✓ |
| `visibilitychange` → hidden | ✓ | ✓ |
| `pagehide` (tab/browser close) | — | sendBeacon → API → ✓ |
| SPA unmount (Next.js Link nav) | ✓ | — |

Guest user: same matrix but Firestore writes are no-ops.

**Why the asymmetric cadence?** localStorage writes are free, so we hammer them every 20s for resilience. Firestore writes cost quota → 60s tick + key user events (pause / hide) keeps us under ~70 writes/session.

---

## 5. Three scenarios

### Scenario A — Guest (not logged in)

- Writes: every save hits `rm` in localStorage only.
- Reads:
  - Watch page resume prompt → `getRecentMovie(movieId)` from localStorage.
  - Continue Watching section → `getRecentMovies()` from localStorage.
- Delete: `removeRecentMovie(movieId)` from localStorage.
- LRU cap: 10 most-recent entries.

### Scenario B — Logged in

- Writes: localStorage + Firestore at their respective cadences.
- Reads:
  - Watch page resume prompt → Firestore `getRecentMovie(userId, movieId)`, fallback to localStorage on miss (covers sync lag / cold caches).
  - Continue Watching section → Firestore `getRecentMovies(userId)`, sorted by `updatedAt` desc.
  - `/movies/recent` page → same as section.
- Delete: `removeRecentMovie(userId, movieId)` Firestore + optimistic state remove.

Cross-device: Firestore is source of truth, `updatedAt` is a client-stamped `Date.now()` so newest write wins.

### Scenario C — Guest → Login transition

1. User has N entries in localStorage `rm` from guest browsing.
2. User logs in → Redux auth state transitions `null → {id}`.
3. `useGuestLoginSync` (mounted in `app/providers.tsx`) detects the transition.
4. For each local entry: fetch the Firestore doc with same id.
   - Firestore has fresher `updatedAt` → keep Firestore (multi-device case).
   - Firestore missing or older → upsert local entry to Firestore.
5. After all writes resolve: `clearRecentMovies()` wipes localStorage `rm`.
6. Subsequent reads come from Firestore.

Idempotency: `syncedForUserRef` guards against React 18 strict-mode double-invocation and Redux state replays during hot reload.

---

## 6. Resume prompt flow

Triggered from `useVideoProgress` when the watch page mounts:

1. Read stored entry (Firestore for auth, localStorage for guest).
2. Filter: `progressTime >= 60s` and episode link is still in `movie.episodes` (skip stale links after OPhim re-uploads).
3. If valid → wait 2s → set `isShowResumePrompt = true`.
4. User accepts → set `videoProgress` (the player effect seeks to that position) + update episode/server indices.
5. User rejects → toast analytics event, dismiss.

The 2s delay gives the player time to load metadata before we ask about seek position.

---

## 7. Continue Watching section

- Server-rendered as `null` (returns nothing on first paint) — auth state is client-only.
- On mount: reads list, sorts by `updatedAt` desc, caps at `MAX_VISIBLE = 10`.
- Hidden when zero entries — no empty state to avoid clutter on fresh installs.
- Swiper carousel (named group `group/list`) — landscape 16:9 cards, 4 visible on lg.
- Card target: `/movies/watch/{slug}` (default) — the watch page resume prompt picks up the rest.
- Delete: hover-reveals an X that replaces the quality/lang badge. Optimistic remove from state → persist → toast on completion.

---

## 8. `/movies/recent` page

- Auth-only route (`/movies/recent` is in `PROTECTED_PATHS` in `middleware.ts`).
- Uses the same `ContinueWatchingItem` component with `target="detail"` — clicks go to the movie detail page (read synopsis / pick episode) instead of the player.
- Grid layout (no carousel) — exhaustive view of the user's history, not a teaser.
- Same delete action as the home section.

---

## 9. Known limitations / non-goals

| | |
|---|---|
| **No conflict resolution within a session.** | Last write wins per field via `setDoc({merge: true})`. Two tabs watching different episodes will see ping-pong updates. Acceptable for one user across few tabs. |
| **Guest data is per-browser.** | Clearing site data wipes history. Use case for login. |
| **`updatedAt` is client-stamped.** | Skewed clocks could mis-resolve cross-device order. Firestore `serverTimestamp()` was rejected because it returns a non-numeric `Timestamp` object that breaks our client-side sort. |
| **No "mark as finished".** | Watching to end leaves the entry in the list. User can dismiss via the X. A future enhancement could auto-remove when `progressTime / progressDuration > 0.9`. |
| **Cron / video on demand.** | The progress tracker doesn't itself drive any background job. Watch-completion events are separately sent to PostHog (see [analytics doc](analytics-posthog.md)). |

---

## 10. Adding a new write surface

Any new place that wants to record progress should:

1. Build an `IRecentMovie` (or partial — `updateWatchProgress` merges).
2. Call `saveRecentMovie(entry)` for localStorage.
3. Call `firebaseServices.updateWatchProgress(entry, userId)` for Firestore (auth only).

Do **not** introduce a separate Firestore collection — keep `recentMovies/{userId}/movies/{movieId}` as the single source. Do **not** introduce a separate localStorage key — `rm` is enough.

---

## 11. Debugging

| Symptom | Likely cause |
|---|---|
| Resume prompt never fires | Check `progressTime >= 60` and that `episodeLink` is still in `movie.episodes`. OPhim sometimes re-uploads with new URLs. |
| Continue Watching empty after login | `useGuestLoginSync` may have failed mid-batch. Check console for per-entry errors. localStorage `rm` will be retained until full success. |
| Continue Watching shows stale progress while watching | `recentMovies` Firestore writes are 60s + force-sync. Sub-minute progress is only in localStorage. |
| Card duplicates after multi-tab watching | Both tabs writing to the same Firestore doc with merge — fields can race, but the doc id is stable so no dupes. |
| Vercel function timeout on `/api/progress/sync` | Beacon payload is small; check Firebase Admin init time. Cold start can hit 1-2s. |
