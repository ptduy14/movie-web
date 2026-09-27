# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] — 2026-09-27

The data source and the player were both replaced. Nothing about the previous
catalog survives, which is why this is a major version rather than a large
minor one: stored URLs, stored ids and stored watch history from 1.x do not
carry over.

### Context

`ophim1.com`, the catalog behind every list, detail and playback URL, was shut
down permanently — its API paths return 404 and its image CDN went with them.
Two replacement investigations are in `docs/`: `vsmov-migration.md` (VSMOV and
KKPhim, the like-for-like options) and `vidsrc-investigation.md` (vidsrc.sh).
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

- `services/movie-services.ts` and every OPhim endpoint.
- `hls.js`, `components/watch/video-controls/**`, `video-player.tsx`,
  `server-section.tsx`, and the four player hooks.
- `NEXT_PUBLIC_API_DOMAIN`, `NEXT_PUBLIC_IMG_DOMAIN`, and `img.ophim.live`
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

Initial development version, backed by the OPhim catalog with an in-house
`hls.js` player. Never formally tagged.
