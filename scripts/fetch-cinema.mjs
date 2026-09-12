// Bakes theatrical schedules (TMDB) into public/data/cinema.json so the
// maintenance page can render them as a pure file read — no runtime API calls,
// no API key in the browser, and no way for TMDB to break the page.
//
// One schedule per region, because a schedule is only useful where the reader
// is: the Vietnamese page shows VN release dates, Vietnamese titles and the
// Vietnamese poster artwork; the English page shows the US equivalents.
//
// Run via: node scripts/fetch-cinema.mjs
// Required env vars: TMDB_ACCESS_TOKEN
// Optional env vars: CINEMA_UPCOMING_LIMIT, CINEMA_NOW_PLAYING_LIMIT

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const TMDB_TOKEN        = process.env.TMDB_ACCESS_TOKEN
const UPCOMING_LIMIT    = Number(process.env.CINEMA_UPCOMING_LIMIT    || '12')
const NOW_PLAYING_LIMIT = Number(process.env.CINEMA_NOW_PLAYING_LIMIT || '10')

// Keep in sync with REGION_BY_LOCALE in lib/cinema-data.ts.
const REGIONS = [
  { region: 'VN', language: 'vi-VN' },
  { region: 'US', language: 'en-US' },
]

if (!TMDB_TOKEN) {
  console.error('Missing required env var: TMDB_ACCESS_TOKEN')
  process.exit(1)
}

const api = async (path) => {
  const res = await fetch(`https://api.themoviedb.org/3/${path}`, {
    headers: { accept: 'application/json', Authorization: `Bearer ${TMDB_TOKEN}` },
  })
  if (!res.ok) throw new Error(`TMDB ${path} -> ${res.status}`)
  return res.json()
}

const todayKey = new Date().toISOString().slice(0, 10)

// Prefer an official trailer, then a teaser, then any clip. Trailers live on
// YouTube for effectively every TMDB title, and the page embeds by key.
function pickTrailer(videos) {
  const youtube = (videos.results || []).filter((v) => v.site === 'YouTube')
  for (const type of ['Trailer', 'Teaser', 'Clip']) {
    const official = youtube.find((v) => v.type === type && v.official)
    if (official) return official.key
    const any = youtube.find((v) => v.type === type)
    if (any) return any.key
  }
  return null
}

/**
 * A localised trailer first (a VN release usually has a Vietnamese-subtitled
 * one), then English, then whatever TMDB has.
 */
async function findTrailer(movieId, language) {
  const attempts = language === 'en-US' ? ['en-US', null] : [language, 'en-US', null]
  for (const lang of attempts) {
    const videos = await api(`movie/${movieId}/videos${lang ? `?language=${lang}` : ''}`)
    const key = pickTrailer(videos)
    if (key) return key
  }
  return null
}

/**
 * One TMDB list (upcoming | now_playing) for one region → render-ready rows.
 *
 * Title and poster both come from the region's own language, so nothing has to
 * be translated or swapped at render time.
 */
async function collect(endpoint, { region, language }, limit) {
  const list = await api(`movie/${endpoint}?language=${language}&region=${region}&page=1`)

  const rows = (list.results || [])
    .filter((m) => m.poster_path && m.release_date)
    .map((m) => ({
      id: m.id,
      title: m.title || m.original_title,
      release_date: m.release_date,
      poster_path: m.poster_path,
      // vote_average is 0 for unreleased titles nobody has rated — show nothing
      // rather than a fake "0.0".
      rating: m.vote_count > 0 ? Number(m.vote_average.toFixed(1)) : null,
    }))

  // `upcoming` occasionally includes titles that opened a few days ago.
  const ordered =
    endpoint === 'upcoming'
      ? rows.filter((m) => m.release_date >= todayKey).sort((a, b) => a.release_date.localeCompare(b.release_date))
      : rows.sort((a, b) => b.release_date.localeCompare(a.release_date))

  const selected = ordered.slice(0, limit)

  // Serial on purpose: a daily job has no reason to hammer TMDB, and a failed
  // trailer lookup must only cost that one movie its play button.
  for (const movie of selected) {
    try {
      movie.trailer = await findTrailer(movie.id, language)
    } catch (err) {
      console.warn(`  ! trailer lookup failed for ${movie.title}: ${err.message}`)
      movie.trailer = null
    }
  }

  return selected
}

async function main() {
  const regions = {}

  for (const target of REGIONS) {
    console.log(`Fetching TMDB cinema schedule — region ${target.region} (${target.language})...`)

    const upcoming = await collect('upcoming', target, UPCOMING_LIMIT)
    const nowPlaying = await collect('now_playing', target, NOW_PLAYING_LIMIT)

    regions[target.region] = {
      region: target.region,
      language: target.language,
      upcoming,
      now_playing: nowPlaying,
    }

    const withTrailer = [...upcoming, ...nowPlaying].filter((m) => m.trailer).length
    console.log(
      `  ${upcoming.length} upcoming + ${nowPlaying.length} now playing (${withTrailer} with trailer)`
    )
    upcoming.forEach((m) => console.log(`    ${m.release_date}  ${m.title}${m.trailer ? '  [trailer]' : ''}`))
  }

  const payload = {
    updated_at: new Date().toISOString(),
    regions,
  }

  const outDir = join(__dirname, '..', 'public', 'data')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'cinema.json'), JSON.stringify(payload, null, 2))

  console.log(`Saved ${Object.keys(regions).join(', ')} → public/data/cinema.json`)
}

main().catch((err) => { console.error(err.message); process.exit(1) })
