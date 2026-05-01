import { FaStar, FaImdb } from 'react-icons/fa';
import type Imdb from 'types/imdb';
import type Tmdb from 'types/tmdb';

interface RatingBadgeProps {
  imdb?: Imdb;
  tmdb?: Tmdb;
  /** Hide the badge entirely if both ratings are 0 / unavailable */
  hideIfEmpty?: boolean;
}

const isValidScore = (score?: number) =>
  typeof score === 'number' && score > 0;

/**
 * Compact rating badge displayed over the poster.
 * Renders the highest-priority available source (IMDb first, then TMDB).
 * Both can be shown side-by-side if both have valid scores.
 */
export default function RatingBadge({ imdb, tmdb, hideIfEmpty = true }: RatingBadgeProps) {
  const showImdb = isValidScore(imdb?.vote_average);
  const showTmdb = isValidScore(tmdb?.vote_average);

  if (hideIfEmpty && !showImdb && !showTmdb) return null;

  return (
    <div className="flex items-center gap-1 text-[10px] font-semibold">
      {showImdb && (
        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-yellow-400 text-black">
          <FaImdb className="text-[12px]" />
          {imdb!.vote_average.toFixed(1)}
        </span>
      )}
      {showTmdb && (
        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-600 text-white">
          <FaStar className="text-[10px]" />
          {tmdb!.vote_average.toFixed(1)}
        </span>
      )}
    </div>
  );
}
