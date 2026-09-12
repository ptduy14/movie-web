// Bakes the Vietnamese theatrical schedule (TMDB) into public/data/cinema.json
// so the maintenance page can render it as a pure file read — no runtime API
// calls, no API key in the browser, and no way for TMDB to break the page.
//
// Run via: node scripts/fetch-cinema.mjs
// Required env vars: TMDB_ACCESS_TOKEN
// Optional env vars: CINEMA_REGION, CINEMA_UPCOMING_LIMIT, CINEMA_NOW_PLAYING_LIMIT

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const TMDB_TOKEN        = process.env.TMDB_ACCESS_TOKEN
const REGION            = process.env.CINEMA_REGION                || 'VN'
const UPCOMING_LIMIT    = Number(process.env.CINEMA_UPCOMING_LIMIT    || '12')
const NOW_PLAYING_LIMIT = Number(process.env.CINEMA_NOW_PLAYING_LIMIT || '10')

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
 * One TMDB list (upcoming | now_playing) → render-ready rows.
 *
 * Fetched twice, vi-VN and en-US, so both locales get a real localized title
 * instead of a client-side translation of a title that TMDB already has.
 */
async function collect(endpoint, limit) {
  const [vi, en] = await Promise.all([
    api(`movie/${endpoint}?language=vi-VN&region=${REGION}&page=1`),
    api(`movie/${endpoint}?language=en-US&region=${REGION}&page=1`),
  ])

  const englishTitle = new Map((en.results || []).map((m) => [m.id, m.title]))

  const rows = (vi.results || [])
    .filter((m) => m.poster_path && m.release_date)
    .map((m) => ({
      id: m.id,
      title: {
        vi: m.title,
        en: englishTitle.get(m.id) || m.original_title || m.title,
      },
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
      let videos = await api(`movie/${movie.id}/videos?language=en-US`)
      if (!(videos.results || []).length) videos = await api(`movie/${movie.id}/videos`)
      movie.trailer = pickTrailer(videos)
    } catch (err) {
      console.warn(`  ! trailer lookup failed for ${movie.title.vi}: ${err.message}`)
      movie.trailer = null
    }
  }

  return selected
}

async function main() {
  console.log(`Fetching TMDB cinema schedule for region ${REGION}...`)

  const [upcoming, nowPlaying] = [
    await collect('upcoming', UPCOMING_LIMIT),
    await collect('now_playing', NOW_PLAYING_LIMIT),
  ]

  const payload = {
    updated_at: new Date().toISOString(),
    region: REGION,
    upcoming,
    now_playing: nowPlaying,
  }

  const outDir = join(__dirname, '..', 'public', 'data')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'cinema.json'), JSON.stringify(payload, null, 2))

  const withTrailer = [...upcoming, ...nowPlaying].filter((m) => m.trailer).length
  console.log(
    `Saved ${upcoming.length} upcoming + ${nowPlaying.length} now playing ` +
    `(${withTrailer} with trailer) → public/data/cinema.json`
  )
  upcoming.forEach((m) => console.log(`  ${m.release_date}  ${m.title.vi}${m.trailer ? '  [trailer]' : ''}`))
}

main().catch((err) => { console.error(err.message); process.exit(1) })
