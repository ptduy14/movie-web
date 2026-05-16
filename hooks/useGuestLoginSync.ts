'use client';

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import firebaseServices from 'services/firebase-services';
import { getRecentMovies, clearRecentMovies } from 'lib/recent-movies-storage';

/**
 * One-shot sync of the guest's localStorage watch history into Firestore on
 * login. Mounted once at the app root (see Providers) so it fires regardless
 * of which page the user is on at the moment of login.
 *
 * Previously this logic lived inside `useVideoProgress`, which meant the
 * sync only ran if the user happened to be on a watch page at login time —
 * the typical case (login from home) left guest history orphaned and the
 * "Continue Watching" section appeared empty until the user re-watched each
 * movie. This hook fixes that.
 *
 * Behavior:
 *  1. Detect the null → {id} transition in Redux auth state.
 *  2. Read every entry from localStorage `rm`.
 *  3. For each entry, fetch the matching Firestore doc and compare
 *     `updatedAt`. Push the guest entry only if it's newer (or Firestore
 *     has no entry). Avoids overwriting fresher data from another device.
 *  4. After all writes settle, clear localStorage `rm` so subsequent logins
 *     don't re-sync the same data.
 *
 * Fire-and-forget: errors per-entry are swallowed (logged) so a single
 * Firestore failure doesn't strand the rest of the batch.
 */
export default function useGuestLoginSync() {
  const user = useSelector((state: any) => state.auth.user);
  // Track the previous user id across renders so we can detect the
  // null → non-null transition that marks a fresh login.
  const prevUserIdRef = useRef<string | null>(user?.id ?? null);
  // Guard against running the same sync twice if Redux replays a user state
  // during hot-reload or React 18 strict-mode double-invocation.
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
      // Resolve per-entry: read Firestore doc, compare timestamps, upsert if
      // newer. Run in parallel — Firestore is happy with concurrent writes
      // to different docs and we cap at ~10 entries so there's no rate-limit
      // concern.
      await Promise.all(
        localEntries.map(async (local) => {
          try {
            const remote = await firebaseServices.getRecentMovie(currentId, local.id);
            const remoteUpdatedAt = remote?.updatedAt ?? 0;
            const localUpdatedAt = local.updatedAt ?? 0;
            if (remote && remoteUpdatedAt >= localUpdatedAt) {
              // Firestore has fresher or equal data — leave it alone.
              return;
            }
            await firebaseServices.updateWatchProgress(local, currentId);
          } catch (err: any) {
            // Per-entry failure shouldn't stop the rest of the batch.
            console.error('guest login sync entry failed:', local.id, err?.message);
          }
        })
      );

      if (cancelled) return;
      // Local data is now in Firestore (or Firestore had newer data we kept).
      // Clearing avoids re-uploading on every subsequent login event and
      // prevents the next account that logs in from inheriting this user's
      // history.
      clearRecentMovies();
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);
}
