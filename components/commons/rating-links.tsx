import { FaImdb, FaExternalLinkAlt } from 'react-icons/fa';
import TMDBLogo from '../logos/TMDB-Logo';
import type Imdb from 'types/imdb';
import type Tmdb from 'types/tmdb';

interface RatingLinksProps {
  imdb?: Imdb;
  tmdb?: Tmdb;
  /** Compact = mobile-friendly inline; Default = desktop block layout */
  variant?: 'default' | 'compact';
}

const isValidScore = (score?: number) => typeof score === 'number' && score > 0;
const isValidId = (id?: string) => typeof id === 'string' && id.length > 0;

const formatVotes = (count?: number) => {
  if (!count || count <= 0) return '';
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
};

const buildImdbUrl = (id: string) => `https://www.imdb.com/title/${id}/`;
const buildTmdbUrl = (type: string, id: string) => {
  // OPhim returns "tv" or "movie" — TMDB URL paths use the same names
  const safeType = type === 'movie' ? 'movie' : 'tv';
  return `https://www.themoviedb.org/${safeType}/${id}`;
};

/**
 * Rating display blocks that double as external links.
 * Each block is a clickable card linking to IMDb / TMDB respectively.
 * Only renders sources that have a valid id AND a non-zero score.
 */
export default function RatingLinks({ imdb, tmdb, variant = 'default' }: RatingLinksProps) {
  const showTmdb = isValidScore(tmdb?.vote_average) && isValidId(tmdb?.id);
  const showImdb = isValidScore(imdb?.vote_average) && isValidId(imdb?.id);

  if (!showTmdb && !showImdb) return null;

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {showTmdb && (
          <a
            href={buildTmdbUrl(tmdb!.type, tmdb!.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/40 transition-colors text-sm"
            title="Xem trên TMDB"
          >
            <span className="font-bold">{tmdb!.vote_average.toFixed(1)}</span>
            <span className="text-white/60 text-xs">TMDB</span>
            <FaExternalLinkAlt className="text-[10px] text-white/60" />
          </a>
        )}
        {showImdb && (
          <a
            href={buildImdbUrl(imdb!.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-400/20 hover:bg-yellow-400/40 transition-colors text-sm"
            title="Xem trên IMDb"
          >
            <FaImdb className="text-yellow-400" />
            <span className="font-bold">{imdb!.vote_average.toFixed(1)}</span>
            <FaExternalLinkAlt className="text-[10px] text-white/60" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {showTmdb && (
        <a
          href={buildTmdbUrl(tmdb!.type, tmdb!.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-3 px-3 py-2 rounded-md bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-700/50 hover:border-emerald-500 transition-all"
          title="Xem trên TMDB"
        >
          <div className="w-[5rem] flex-shrink-0">
            <TMDBLogo />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-lg">{tmdb!.vote_average.toFixed(1)}</span>
            <span className="text-white/60 text-sm">/10</span>
          </div>
          {tmdb!.vote_count > 0 && (
            <span className="text-xs text-white/60">({formatVotes(tmdb!.vote_count)})</span>
          )}
          <FaExternalLinkAlt className="text-xs text-white/40 group-hover:text-white/80 transition-colors" />
        </a>
      )}

      {showImdb && (
        <a
          href={buildImdbUrl(imdb!.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-3 px-3 py-2 rounded-md bg-yellow-900/30 hover:bg-yellow-900/50 border border-yellow-700/50 hover:border-yellow-500 transition-all"
          title="Xem trên IMDb"
        >
          <FaImdb className="text-yellow-400 text-3xl flex-shrink-0" />
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-lg">{imdb!.vote_average.toFixed(1)}</span>
            <span className="text-white/60 text-sm">/10</span>
          </div>
          {imdb!.vote_count > 0 && (
            <span className="text-xs text-white/60">({formatVotes(imdb!.vote_count)})</span>
          )}
          <FaExternalLinkAlt className="text-xs text-white/40 group-hover:text-white/80 transition-colors" />
        </a>
      )}
    </div>
  );
}
