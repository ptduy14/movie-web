// Fetches trending movies from PostHog HogQL and writes to public/data/trending.json.
// Run via: node scripts/fetch-trending.mjs
// Required env vars: POSTHOG_PROJECT_ID, POSTHOG_PERSONAL_API_KEY
// Optional env vars: POSTHOG_HOST, TRENDING_INTERVAL_DAYS, TRENDING_LIMIT

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const POSTHOG_HOST        = process.env.POSTHOG_HOST               || 'https://us.posthog.com'
const PROJECT_ID          = process.env.POSTHOG_PROJECT_ID
const PERSONAL_API_KEY    = process.env.POSTHOG_PERSONAL_API_KEY
const INTERVAL_DAYS       = Number(process.env.TRENDING_INTERVAL_DAYS || '7')
const LIMIT               = Number(process.env.TRENDING_LIMIT         || '5')

if (!PROJECT_ID || !PERSONAL_API_KEY) {
  console.error('Missing required env vars: POSTHOG_PROJECT_ID, POSTHOG_PERSONAL_API_KEY')
  process.exit(1)
}

const HOGQL = `
WITH base AS (
  SELECT
    anyIf(properties.title,       event = 'movie_viewed') AS title,
    anyIf(properties.slug,        event = 'movie_viewed') AS slug,
    anyIf(properties.thumb_url,   event = 'movie_viewed') AS thumb_url,
    anyIf(properties.year,        event = 'movie_viewed') AS year,
    anyIf(properties.tmdb_id,     event = 'movie_viewed') AS tmdb_id,
    anyIf(properties.tmdb_type,   event = 'movie_viewed') AS tmdb_type,
    anyIf(properties.tmdb_rating, event = 'movie_viewed') AS tmdb_rating,
    properties.movie_id                                   AS movie_id,
    countIf(event = 'movie_viewed')                       AS views,
    countIf(event = 'movie_play_started')                 AS plays,
    countIf(event = 'movie_play_completed')               AS completions
  FROM events
  WHERE event IN ('movie_viewed', 'movie_play_started', 'movie_play_completed')
    AND timestamp > now() - INTERVAL ${INTERVAL_DAYS} DAY
  GROUP BY movie_id
  HAVING plays > 0
)
SELECT
  title,
  slug,
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

async function main() {
  console.log(`Querying PostHog — last ${INTERVAL_DAYS} days, top ${LIMIT} movies...`)

  const movies = await queryPostHog()

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
  movies.forEach((m, i) => console.log(`  ${i + 1}. ${m.title} (score: ${m.trending_score})`))
}

main().catch(err => { console.error(err.message); process.exit(1) })
