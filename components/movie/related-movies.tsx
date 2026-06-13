'use client';

import RegularMovieItem from '../commons/regular-movie-item';
import type Movie from 'types/movie';

/**
 * "More Like This" — same-genre titles on the movie detail page.
 *
 * Rendered as a responsive GRID (Netflix-style "More Like This") rather than a
 * carousel: it fills the centered content container with even gaps and reads
 * as a "browse more" block instead of a cramped single row. Self-contained, so
 * it doesn't depend on the home page's `HomePageLoadingProvider`.
 */
interface RelatedMoviesProps {
  title: string;
  movies: Movie[];
}

export default function RelatedMovies({ title, movies }: RelatedMoviesProps) {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Section header — matches the home rows' red accent bar */}
      <h2 className="relative inline-block pl-4 text-xl md:text-2xl font-bold tracking-tight">
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 md:h-7 bg-gradient-to-b from-red-500 to-red-700 rounded-full"></span>
        {title}
      </h2>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 lg:gap-4">
        {movies.map((movie) => (
          <RegularMovieItem key={movie._id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
