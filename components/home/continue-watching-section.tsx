'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslations } from 'next-intl';
import firebaseServices from 'services/firebase-services';
import { getRecentMovies as getLocalRecentMovies } from 'lib/recent-movies-storage';
import ContinueWatchingItem from '../commons/continue-watching-item';
import type { IRecentMovie } from 'types/recent-movie';

const MAX_VISIBLE = 10;
const MIN_PROGRESS_SECONDS = 1; // hide entries with effectively zero progress

/**
 * "Continue Watching" carousel rendered on the home page just below the hero.
 *
 * Data source switches on auth state:
 *  - Authenticated → `recentMovies/{userId}/movies` Firestore collection
 *  - Guest         → `recent_movies` localStorage entry (mirrors the same schema)
 *
 * Server-rendered as nothing (returns null on first render) so the home page's
 * server component doesn't need user-specific data. On client mount we resolve
 * the list and only paint the section if there's at least one entry with real
 * progress — avoids a jarring "Continue Watching" row appearing empty.
 */
export default function ContinueWatchingSection() {
  const t = useTranslations('home');
  const user = useSelector((state: any) => state.auth.user);

  const [movies, setMovies] = useState<IRecentMovie[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      let list: IRecentMovie[];
      if (user?.id) {
        // Firestore returns the array in insertion order — re-sort here so the
        // last-watched item is leftmost, matching the localStorage behavior.
        const res = (await firebaseServices.getRecentMovies(user.id)) as IRecentMovie[];
        list = [...res].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
      } else {
        list = getLocalRecentMovies();
      }

      // Filter to entries that represent actual watching, not just a visit
      // (e.g., the auth-side mount effect inserts a metadata-only entry the
      // first time a movie page loads — those have no progressTime yet).
      const meaningful = list.filter(
        (m) => typeof m.progressTime === 'number' && m.progressTime >= MIN_PROGRESS_SECONDS
      );

      if (!cancelled) setMovies(meaningful.slice(0, MAX_VISIBLE));
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Initial render or zero results → render nothing. Hide-when-empty matches
  // the UX choice locked in earlier; users without history don't see a
  // confusing empty state.
  if (!movies || movies.length === 0) return null;

  return (
    // Layout mirrors `MovieList` exactly so this section visually rhymes with
    // the rows below — same outer `container-wrapper space-y-4`, same
    // mobile-only inner `px-4 md:px-0`, same red-bar-prefixed h2. Without
    // this the section flowed flush to the viewport edge on desktop and lost
    // mobile padding entirely.
    <div className="container-wrapper space-y-4">
      <div className="px-4 md:px-0">
        <h2 className="relative inline-block pl-4 text-xl md:text-2xl font-bold tracking-tight">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 md:h-7 bg-gradient-to-b from-red-500 to-red-700 rounded-full"></span>
          {t('continueWatching')}
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4 md:px-0">
        {movies.map((movie) => (
          <ContinueWatchingItem key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
