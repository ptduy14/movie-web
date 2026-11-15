# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] — 2026-11-15

This major release replaces the catalog and playback architecture. It introduces
a new movie catalog and primary playback experience, with a secondary playback
option and additional metadata and artwork enrichment. Stored identifiers, URLs,
and watch history from 2.x do not carry over.

### Added

- A new catalog integration, adapter, and taxonomy.
- Home page sections for theatrical releases and titles with voice-over audio.
- Audio-version filters across browse pages.
- Season links on title pages.
- A custom HLS playlist filter for removing in-stream video ads.
- Playback reachability notices and a secondary playback option when the main
  stream is unavailable.
- A video-element bridge so playback progress and analytics work with both
  playback experiences.
- Additional metadata enrichment, including English titles and synopses,
  ratings, trailers, and external identifiers.

### Changed

- **Title identity.** URLs now use catalog slugs and storage uses catalog IDs.
  Legacy 2.x URLs are resolved where possible; retired category and country
  slugs redirect to their closest supported equivalents.
- **Playback.** The in-house HLS player and controls return as the primary
  experience, with a secondary playback option. Episode data now represents
  audio versions rather than seasons.
- **Translation.** The translation flow now translates catalog content into
  English, and English pages prefer available original English
  metadata.
- English pages use the original-language title when available.
- External title identifiers can be absent.
- Large catalog images are supported by the image loader and resizer.
- Home and detail hero images use higher-resolution artwork when available,
  with catalog images as a fallback.
- The pre-play poster and next-episode card use the same artwork selection and
  responsive image sizing.
- Footer attribution and notices were added for third-party metadata and
  artwork.
- The application and scheduled workflows now target Node.js 24.
- Footer category links and localized browse titles were updated.
- The Firebase Admin credential now uses a server-only environment variable.

### Removed

- The previous playback-availability index and its scheduled refresh workflow.
- The previous catalog adapter and discovery taxonomy.
- The rating sort, which is not supported by the current catalog.

### Data and compatibility

- Records keyed by the previous catalog IDs are not compatible with the new
  catalog. The legacy cleanup script can remove those records; back up data and
  review its dry-run output before applying it.
- User accounts are not part of that legacy cleanup.

### Known issues

- Primary stream availability depends on the viewer's region; the secondary
  playback option may have fewer audio choices.
- Browsers using native HLS without Media Source Extensions may not apply the
  custom ad filter.
- Some legacy-slug redirects are handled by the application rather than sent
  as permanent HTTP redirects.
- Verify catalog reachability from the production deployment environment
  during preview testing.

## [2.0.0] — 2026-09-27

This major release replaced the catalog and playback architecture. Stored URLs,
IDs, and watch history from 1.x do not carry over.

### Added

- A searchable, browsable catalog with trending titles, details, and seasons.
- A scheduled availability index to keep unavailable titles out of browse
  results.
- An embedded-player bridge for playback progress and status.
- A season picker on the watch page.
- A legacy-data cleanup script that defaults to dry-run mode and leaves user
  accounts untouched.

### Changed

- **Title identity.** IDs are now namespaced by media type, and movie URLs use
  the new title/type/ID format. Legacy 1.x URLs no longer resolve.
- **Playback.** The in-house HLS player was replaced by an embedded player;
  playback controls, subtitles, quality selection, and fullscreen behavior
  depend on the embedded experience.
- **Translation.** The translation flow changed to English-to-Vietnamese.
  Cached translations are invalidated when their source text changes.
- The translated-content notice is based on the synopsis language.
- Synopses render as text rather than HTML.
- Browse pagination now reports whether more results are available.
- Browse taxonomy is shared between navigation and discovery.
- Home page sections can fail independently without taking down the full page.

### Removed

- The previous catalog integration and its API endpoints.
- The in-house HLS player and its custom controls.
- Legacy image and API configuration.
- A country filter that did not map cleanly to the new catalog.

### Fixed

- Cache configuration accepts both supported environment-variable naming
  schemes.
- Data requests check upstream status and response content type before parsing.

### Known issues

- Playback availability and subtitle options depend on the embedded service and
  may vary by viewer or title.
- Some quality indicators are available only for recently added titles.

## [0.1.0]

Initial development version, backed by the original catalog integration and an
in-house HLS player. Never formally tagged.
