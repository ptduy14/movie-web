// Fetches trending movies from PostHog HogQL, enriches each row with TMDB
// poster + live rating, and writes to public/data/trending.json so the app
// can render the section as a pure file read (no runtime TMDB calls).
//
// Run via: node scripts/fetch-trending.mjs
// Required env vars: POSTHOG_PROJECT_ID, POSTHOG_PERSONAL_API_KEY, TMDB_ACCESS_TOKEN
// Optional env vars: POSTHOG_HOST, TMDB_IMG_DOMAIN, TRENDING_INTERVAL_DAYS, TRENDING_LIMIT

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const POSTHOG_HOST     = process.env.POSTHOG_HOST            || 'https://us.posthog.com'
const PROJECT_ID       = process.env.POSTHOG_PROJECT_ID
const PERSONAL_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY
const TMDB_TOKEN       = process.env.TMDB_ACCESS_TOKEN
const TMDB_IMG_DOMAIN  = process.env.TMDB_IMG_DOMAIN         || 'https://image.tmdb.org'
const INTERVAL_DAYS    = Number(process.env.TRENDING_INTERVAL_DAYS || '7')
const LIMIT            = Number(process.env.TRENDING_LIMIT         || '5')

if (!PROJECT_ID || !PERSONAL_API_KEY || !TMDB_TOKEN) {
  console.error('Missing required env vars: POSTHOG_PROJECT_ID, POSTHOG_PERSONAL_API_KEY, TMDB_ACCESS_TOKEN')
  process.exit(1)
}

// argMaxIf picks the metadata value carried by the *latest* `movie_viewed`
// event for each movie — deterministic (unlike anyIf, which picks arbitrarily)
// and reflects the most recent admin edit to title/slug/etc within the window.
const HOGQL = `
WITH base AS (
  SELECT
    argMaxIf(properties.title,     timestamp, event = 'movie_viewed') AS title,
    argMaxIf(properties.slug,      timestamp, event = 'movie_viewed') AS slug,
    argMaxIf(properties.thumb_url, timestamp, event = 'movie_viewed') AS thumb_url,
    argMaxIf(properties.year,      timestamp, event = 'movie_viewed') AS year,
    argMaxIf(properties.tmdb_id,   timestamp, event = 'movie_viewed') AS tmdb_id,
    argMaxIf(properties.tmdb_type, timestamp, event = 'movie_viewed') AS tmdb_type,
    properties.movie_id                                                AS movie_id,
    countIf(event = 'movie_viewed')                                    AS views,
    countIf(event = 'movie_play_started')                              AS plays,
    countIf(event = 'movie_play_completed')                            AS completions
  FROM events
  WHERE event IN ('movie_viewed', 'movie_play_started', 'movie_play_completed')
    AND timestamp > now() - INTERVAL ${INTERVAL_DAYS} DAY
  GROUP BY movie_id
  HAVING plays > 0
)
SELECT
  title,
  slug,
  thumb_url,
  year,
  tmdb_id,
  tmdb_type,
  movie_id,
  views,
  plays,
  completions,
  round(
    (views       / greatest(max(views)       OVER (), 1)) * 0.2 +
    (plays       / greatest(max(plays)       OVER (), 1)) * 0.4 +
    (completions / greatest(max(completions) OVER (), 1)) * 0.4
  , 3) AS trending_score
FROM base
ORDER BY trending_score DESC
LIMIT ${LIMIT}
`

async function queryPostHog() {
  const url = `${POSTHOG_HOST}/api/projects/${PROJECT_ID}/query`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERSONAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query: HOGQL } }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PostHog API ${res.status}: ${text}`)
  }

  // PostHog returns { columns: [...], results: [[val, val, ...], ...] }
  const { columns, results } = await res.json()
  return results.map(row =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  )
}

// Live vote_average from TMDB — avoids carrying a snapshot rating in the
// PostHog event (which would go stale between view and cron run).
async function fetchTmdbRating(id, type) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?language=en-US`, {
      headers: { accept: 'application/json', Authorization: `Bearer ${TMDB_TOKEN}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return typeof data.vote_average === 'number' ? data.vote_average : null
  } catch {
    return null
  }
}

// Mirrors fetchMoviePosterUrl in utils/tmdb-logo.ts: English-tagged posters
// first, then by community vote_average. Baked into trending.json so the
// component can render without any runtime TMDB call.
async function fetchTmdbPosterUrl(id, type) {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${type}/${id}/images?include_image_language=en,null`,
      { headers: { accept: 'application/json', Authorization: `Bearer ${TMDB_TOKEN}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const posters = data.posters ?? []
    if (posters.length === 0) return null
    const sorted = [...posters].sort((a, b) => {
      const aEn = a.iso_639_1 === 'en' ? 1 : 0
      const bEn = b.iso_639_1 === 'en' ? 1 : 0
      if (aEn !== bEn) return bEn - aEn
      return b.vote_average - a.vote_average
    })
    return `${TMDB_IMG_DOMAIN}/t/p/w500${sorted[0].file_path}`
  } catch {
    return null
  }
}

async function enrichWithTmdb(movie) {
  if (!movie.tmdb_id || !movie.tmdb_type) {
    return { ...movie, tmdb_rating: null, poster_url: movie.thumb_url || null }
  }
  const [rating, posterUrl] = await Promise.all([
    fetchTmdbRating(movie.tmdb_id, movie.tmdb_type),
    fetchTmdbPosterUrl(movie.tmdb_id, movie.tmdb_type),
  ])
  return {
    ...movie,
    tmdb_rating: rating,
    poster_url: posterUrl || movie.thumb_url || null,
  }
}

async function main() {
  console.log(`Querying PostHog — last ${INTERVAL_DAYS} days, top ${LIMIT} movies...`)

  const rawMovies = await queryPostHog()
  console.log(`Enriching ${rawMovies.length} movies with TMDB poster + rating...`)
  const movies = await Promise.all(rawMovies.map(enrichWithTmdb))

  const payload = {
    updated_at:    new Date().toISOString(),
    interval_days: INTERVAL_DAYS,
    movies,
  }

  const outDir  = join(__dirname, '..', 'public', 'data')
  const outFile = join(outDir, 'trending.json')

  mkdirSync(outDir, { recursive: true })
  writeFileSync(outFile, JSON.stringify(payload, null, 2))

  console.log(`Saved ${movies.length} movies → public/data/trending.json`)
  movies.forEach((m, i) => {
    const posterStatus = m.poster_url
      ? (m.poster_url.includes('image.tmdb.org') ? 'tmdb' : 'fallback')
      : 'none'
    console.log(`  ${i + 1}. ${m.title} (score: ${m.trending_score}, rating: ${m.tmdb_rating ?? 'n/a'}, poster: ${posterStatus})`)
  })
}

main().catch(err => { console.error(err.message); process.exit(1) })
