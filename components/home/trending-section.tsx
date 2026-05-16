import { getTranslations } from 'next-intl/server';
import { Link } from 'i18n/routing';
import { FaStar } from 'react-icons/fa';
import MovieServices from 'services/movie-services';

// Mock data — slugs from PostHog trending analysis.
// Replace with trending.json read once the cron job has run.
const MOCK_TRENDING_SLUGS = [
  'the-boys-phan-5',
  're-trai-phan-2',
  'gen-v',
  'tro-choi-vuong-quyen-6',
  'the-he-v-phan-2',
];

export default async function TrendingSection() {
  const t = await getTranslations('home.trending');

  const results = await Promise.allSettled(
    MOCK_TRENDING_SLUGS.map((slug) => MovieServices.getDetailMovie(slug))
  );

  const movies = results
    .map((r, i) => {
      if (r.status !== 'fulfilled' || !r.value?.movie) return null;
      const m = r.value.movie;
      return {
        rank: i + 1,
        slug: m.slug as string,
        title: m.name as string,
        poster_url: (m.poster_url || m.thumb_url) as string,
        year: m.year as number,
        rating: (m.tmdb?.vote_average ?? 0) as number,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  if (movies.length === 0) return null;

  return (
    <div className="container-wrapper space-y-4">
      <div className="px-4 md:px-0">
        <h2 className="relative inline-block pl-4 text-xl md:text-2xl font-bold tracking-tight">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 md:h-7 bg-gradient-to-b from-red-500 to-red-700 rounded-full" />
          {t('title')}
        </h2>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-5 px-4 md:px-0">
        {movies.map((movie) => (
          <Link
            key={movie.slug}
            href={`/movies/${movie.slug}`}
            className="relative flex items-end group"
          >
            {/* Rank number — sits behind the card */}
            <span
              className="relative z-0 flex-shrink-0 font-black leading-none pb-3 -mr-5 select-none pointer-events-none"
              style={{
                fontSize: 'clamp(56px, 8.5vw, 128px)',
                WebkitTextStroke: '3px rgba(255,255,255,0.30)',
                color: 'transparent',
              }}
            >
              {movie.rank}
            </span>

            {/* Card */}
            <div className="relative z-10 flex-1 min-w-0 rounded-xl overflow-hidden bg-gray-800 shadow-lg">
              <div className="aspect-[2/3]">
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.07]"
                />
              </div>

              {/* Hover overlay — info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 gap-1">
                <p className="text-xs font-bold uppercase tracking-wide leading-tight line-clamp-2">
                  {movie.title}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-300">
                  <FaStar className="text-yellow-400 shrink-0 text-[9px]" />
                  <span>{movie.rating.toFixed(1)}</span>
                  <span>·</span>
                  <span>{movie.year}</span>
                </div>
              </div>

              {/* Hover play button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border-2 border-white/60 flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-300">
                  <svg className="w-4 h-4 fill-white ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
