'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { doc, getDoc } from 'firebase/firestore';
import { db } from 'lib/firebase';
import {
  setCollection,
  clearCollection,
} from '../redux/slices/collection-slice';
import type MovieCollection from 'types/movie-collection';

/**
 * Fetches the logged-in user's movie collection from Firestore exactly once
 * per session and caches it in Redux. After that, every card / button across
 * the app reads collection state from Redux (free) instead of Firestore.
 *
 * Cost: 1 read per login session (vs N reads per page load with per-card
 * pre-checks). Critical for free-tier viability.
 *
 * Mount this hook ONCE at a top-level component (e.g., Providers / Layout).
 */
export default function useCollectionFetcher() {
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth.user);
  const loaded = useSelector((state: any) => state.collection.loaded);

  useEffect(() => {
    // No user → ensure collection is empty (fresh login)
    if (!user) {
      dispatch(clearCollection());
      return;
    }

    // Already loaded for this session — skip
    if (loaded) return;

    let cancelled = false;
    (async () => {
      try {
        const userMoviesRef = doc(db, 'userMovies', user.id);
        const snapshot = await getDoc(userMoviesRef);
        if (cancelled) return;

        const movies: MovieCollection[] = snapshot.exists()
          ? (snapshot.data().movies as MovieCollection[]) || []
          : [];

        dispatch(setCollection(movies));
      } catch (err: any) {
        console.log('useCollectionFetcher error:', err.message);
        // Mark loaded=true even on error so we don't retry forever in this session
        if (!cancelled) dispatch(setCollection([]));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loaded, dispatch]);
}
