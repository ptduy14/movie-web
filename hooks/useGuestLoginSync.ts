'use client';

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import firebaseServices from 'services/firebase-services';
import { getRecentMovies, clearRecentMovies } from 'lib/recent-movies-storage';

/**
 * On guest → login transition, push the localStorage `rm` history into
 * Firestore `recentMovies`. Compares `updatedAt` per entry to avoid
 * overwriting fresher data from another device. Clears localStorage on
 * success so subsequent logins don't re-sync.
 */
export default function useGuestLoginSync() {
  const user = useSelector((state: any) => state.auth.user);
  const prevUserIdRef = useRef<string | null>(user?.id ?? null);
  const syncedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    const currentId: string | null = user?.id ?? null;
    const wasGuest = prevUserIdRef.current === null;
    prevUserIdRef.current = currentId;

    if (!currentId || !wasGuest) return;
    if (syncedForUserRef.current === currentId) return;
    syncedForUserRef.current = currentId;

    const localEntries = getRecentMovies();
    if (localEntries.length === 0) return;

    let cancelled = false;

    (async () => {
      await Promise.all(
        localEntries.map(async (local) => {
          try {
            const remote = await firebaseServices.getRecentMovie(currentId, local.id);
            const remoteUpdatedAt = remote?.updatedAt ?? 0;
            const localUpdatedAt = local.updatedAt ?? 0;
            if (remote && remoteUpdatedAt >= localUpdatedAt) return;
            await firebaseServices.updateWatchProgress(local, currentId);
          } catch (err: any) {
            console.error('guest login sync entry failed:', local.id, err?.message);
          }
        })
      );

      if (cancelled) return;
      clearRecentMovies();
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);
}
