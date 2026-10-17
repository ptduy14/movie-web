# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] — 2026-10-17

The catalog and the main player were replaced again. A Vietnamese movie API
is now both the catalog AND the stream; TMDB is demoted to an extras layer
and vidsrc to a backup player. Stored ids, URLs and watch history from 2.x do not
carry over — hence a major version.

### Context

v2's TMDB + vidsrc pairing played only what vidsrc happened to carry, with
subtitles only — no Vietnamese voiceover or dub — and depended on a daily id
index to hide titles that would not play. The new catalog hosts a stream for
every title it lists, in up to three audio versions (Vietsub / Thuyết Minh / Lồng
Tiếng), with Vietnamese metadata. Its video CDN only answers Vietnamese IPs,
which shaped most of the player work below.

### Added

- Catalog API client, adapter and taxonomy: `services/catalog-api.ts`,
  `lib/catalog-adapter.ts`, `constants/catalog-taxonomy.ts`.
- Home rails "Phim Chiếu Rạp" and "Có Thuyết Minh"; the daily banner shows
  the catalog's real "updated today" count.
- Audio filter (Vietsub / Thuyết minh / Lồng tiếng) on every browse page.
- "Seasons" row on the detail page — the catalog lists each season as its own
  title, linked here.
- `lib/hls-ad-filter.ts`: a custom hls.js playlist loader that cuts the 30 s
  video ad the catalog splices into its playlists.
- `hooks/useStreamReachability.ts` + `components/watch/stream-notice.tsx`:
  detects when the stream can't load and why (Cloudflare WARP, a VPN,
  viewing from abroad, or the CDN), tells the viewer what to switch off, and
  offers — or, abroad, switches to — the backup source. All in the browser;
  no IP leaves it.
- `hooks/useVideoElementBridge.ts`: feeds `<video>` playback into the same
  snapshot/event shape as the iframe bridge, so progress and analytics work
  on either player.
- `services/tmdb-enrichment.ts`: matches titles that have no TMDB id
  (~22% of the catalog), adds the English synopsis and title on `en`, rating,
  trailer and IMDb id. Time-boxed to 3 s.

### Changed

- **Title identity.** URLs are catalog slugs (`/movies/nha-ngoai-giao-phan-4`),
  storage keys are catalog `_id`s. v2 slugs (`…-tv-1399`) resolve by TMDB id
  and redirect; retired genre/country slugs redirect to their nearest
  catalog equivalent (`gia-tuong` → `vien-tuong`, `hoa-ky` → `au-my`).
- **Playback.** The in-house `hls.js` player and its controls are back, on
  the catalog's own m3u8 streams. The vidsrc iframe is the backup source. `episodes[]` means
  audio servers again, not seasons.
- **Translation direction** flipped back to VI → EN: the catalog writes
  Vietnamese, and the English site uses TMDB's own English text first. The
  translation cron walks the catalog's latest feed and only translates titles
  TMDB can't cover; its default target locale is now `en`.
- English pages show the original title (`origin_name`, or TMDB's English
  title) as the primary title and in `<title>`.
- `Tmdb.id` / `Imdb.id` are nullable.
- `phimimg.com` is allowed by `next/image` and the `/api/image` resizer —
  some catalog originals are ~1 MB.

### Removed

- The vidsrc availability index: `services/vidsrc-availability.ts`,
  `POST /api/vidsrc/sync-ids`, `.github/workflows/vidsrc-ids-cron.yml`, and
  vidsrc's latest-feed / id-dump readers.
- `lib/tmdb-adapter.ts`, TMDB discover, and the TMDB genre/country/format
  taxonomy (`constants/tmdb-taxonomy.ts` now only exports `MediaType`).
- The "rating" sort — the catalog API has no rating order.

### Data

- Firestore collections keyed by the previous catalog's ids are wiped with
  `npm run wipe:legacy:confirm` (decision D3). A dry run on 2026-10-17
  counted 33,577 `translations` (from the v1 provider, no `sourceHash`, mostly
  ids the catalog doesn't have), 4 `userMovies`, 6 `movieComments` (+5), 3
  `userNotifications` (+3) and 1 `cronMeta`. `users` is not touched.

### Known issues

- The main stream only plays from Vietnamese IPs. Elsewhere the backup
  source plays, with subtitles only.
- Native-HLS browsers that lack MSE (older iOS Safari) can't run the ad
  filter and will show the spliced ad.
- Old-slug redirects are streamed (`NEXT_REDIRECT` after a 200, because of
  `loading.tsx`), not HTTP 301s.
- Gate K2 — the catalog API reachable from the Vercel region — is checked on the
  first preview deploy.

## [2.0.0] — 2026-09-27

The data source and the player were both replaced. Nothing about the previous
catalog survives, which is why this is a major version rather than a large
minor one: stored URLs, stored ids and stored watch history from 1.x do not
carry over.

### Context

The original catalog API, behind every list, detail and playback URL, was shut
down permanently — its API paths return 404 and its image CDN went with them.
Two replacement investigations are in `docs/`: `vsmov-migration.md` (VSMOV and
the catalog, the like-for-like options) and `vidsrc-investigation.md` (vidsrc.sh).
vidsrc.sh was chosen.

vidsrc solves playback only — it has no search, no metadata and no browse — so
the catalog moved to TMDB and the two are joined by an availability index.

### Added

- TMDB-backed catalog: discover, trending, multi-search, detail and seasons,
  behind `services/catalog-service.ts`.
- vidsrc availability index — two Redis sets of playable TMDB ids, rebuilt
  daily from the provider's `/ids/*.txt` dumps by a new GitHub Actions cron
  (`.github/workflows/vidsrc-ids-cron.yml`) via `POST /api/vidsrc/sync-ids`.
  Lists are intersected with it so grids don't show titles that won't play.
- `hooks/useVidsrcBridge` — the `postMessage` channel to the embedded player,
  supplying playback position, duration and status where a `<video>` element
  used to.
- Season picker on the watch page, driven by TMDB season data.
- `scripts/wipe-legacy-collections.js` — removes the Firestore collections
  keyed by the old catalog's ids. Dry run by default; `--confirm` to apply.
  Leaves `users` untouched.
- `NEXT_PUBLIC_VIDSRC_DOMAIN` and `NEXT_PUBLIC_VIDSRC_SANDBOX` env vars.

### Changed

- **Title identity.** Ids are namespaced (`movie-68721`, `tv-1399`) because
  TMDB numbers films and series in separate sequences that collide. URLs
  became `/movies/<title>-<type>-<id>`; every 1.x URL is dead.
- **Playback.** The in-house `hls.js` player and its custom controls were
  replaced by the provider's iframe. vidsrc serves streams only through its
  embed — the media URL sits behind a short-lived, host-bound token — so
  controls, subtitles, quality and fullscreen are no longer ours to style.
- **Translation direction.** TMDB is English-first, so Groq now runs EN→VI.
  The English site needs no translation at all; Vietnamese carries the quota,
  and only for titles TMDB has not translated itself. Cached translations
  invalidate on a hash of the source text instead of the old provider's
  `modified` timestamp, which TMDB does not have.
- **"AI translated" disclaimer** is now driven by the synopsis's actual
  language rather than inferred from the locale, which after the direction
  flip would have labelled every untranslated English page as translated.
- Synopses render as text, not HTML. TMDB returns plain prose, which closes
  an `innerHTML` sink that only existed for the old provider's markup.
- Browse pagination reports `hasMore` explicitly, because availability
  filtering makes page sizes irregular and the old "a short page means the
  end" heuristic stopped pagination early.
- Taxonomy is derived from `constants/tmdb-taxonomy.ts`, so header menus and
  discover constraints cannot drift apart.
- Home rails degrade individually: one failing rail renders empty instead of
  rejecting the whole server render.

### Removed

- `services/movie-services.ts` and every v1 provider endpoint.
- `hls.js`, `components/watch/video-controls/**`, `video-player.tsx`,
  `server-section.tsx`, and the four player hooks.
- `NEXT_PUBLIC_API_DOMAIN`, `NEXT_PUBLIC_IMG_DOMAIN`, and `img.v1.live`
  from the image allowlist.
- The `au-my` country filter — it meant "US + Europe", which has no ISO code
  and no discover equivalent. Use `hoa-ky` plus the individual entries.

### Fixed

- `lib/upstash.ts` only read `UPSTASH_REDIS_REST_*`, so in an environment
  provisioned through Vercel KV (`KV_REST_API_*`) the client resolved to
  `null`: every cache read missed and every write was dropped, silently. Both
  variable pairs are accepted now.
- Unguarded `res.json()` in the data layer. A 404-with-HTML upstream used to
  surface as `SyntaxError: Unexpected token '<'` from inside a server render,
  returning a blank 200. The TMDB client checks status and content type.

### Known issues

- Gates **V1** (does the player survive an iframe `sandbox`?) and **V2** (do
  Vietnamese ISPs block the provider?) are open — see
  `docs/vidsrc-migration-plan.md` §6. V2 has no fallback if it fails.
- Vietnamese subtitles are best-effort from the provider; there is no
  Vietnamese dub or voiceover in its catalog.
- `quality` badges only appear for titles in the provider's "recently added"
  feed. TMDB has no release-quality concept.

## [0.1.0]

Initial development version, backed by the v1 provider's catalog with an in-house
`hls.js` player. Never formally tagged.
