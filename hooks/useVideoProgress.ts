'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import firebaseServices from 'services/firebase-services';
import { saveVideoProgress, getVideoProgress } from 'lib/video-progress-storage';
import type DetailMovie from 'types/detail-movie';
import type { IRecentMovie } from 'types/recent-movie';

const LS_INTERVAL_MS = 20_000; // localStorage every 20s
const FS_INTERVAL_MS = 60_000; // Firestore every 60s (logged users only)
const MIN_PROGRESS_TO_SHOW = 60; // seconds

export interface RestoredProgress {
  position: number;
  episodeIndex: number;
  episodeLink: string;
}

export interface UseVideoProgressOptions {
  movie: DetailMovie;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  episodeIndex: number;
  episodeLink: string;
  serverIndex: number;
  setEpisodeIndex: React.Dispatch<React.SetStateAction<number>>;
  setEpisodeLink: React.Dispatch<React.SetStateAction<string>>;
  setServerIndex?: React.Dispatch<React.SetStateAction<number>>;
}

export interface UseVideoProgressReturn {
  restoredProgress: RestoredProgress;
  isShowResumePrompt: boolean;
  handleAcceptResume: () => void;
  handleRejectResume: () => void;
  setVideoProgress: React.Dispatch<React.SetStateAction<number | null>>;
  videoProgress: number | null;
}

export function useVideoProgress({
  movie,
  videoRef,
  episodeIndex,
  episodeLink,
  serverIndex,
  setEpisodeIndex,
  setEpisodeLink,
  setServerIndex,
}: UseVideoProgressOptions): UseVideoProgressReturn {
  const user = useSelector((state: any) => state.auth.user);

  const [restoredProgress, setRestoredProgress] = useState<RestoredProgress>({
    position: 0,
    episodeIndex: 0,
    episodeLink: '',
  });
  const [isShowResumePrompt, setIsShowResumePrompt] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);

  const movieId = movie.movie._id;

  // Refs to avoid stale closures in async callbacks and event handlers
  const progressRef = useRef({ episodeIndex, episodeLink, serverIndex });
  progressRef.current = { episodeIndex, episodeLink, serverIndex };

  const userRef = useRef(user);
  userRef.current = user;

  const hasRestoredRef = useRef(false);

  // Track previous userId to detect login event (null → non-null transition)
  const prevUserIdRef = useRef<string | null>(user?.id ?? null);

  // ===== HELPERS =====

  const isValidEpisodeLink = useCallback(
    (link: string) => {
      if (!link) return false;
      for (const ep of movie.episodes || []) {
        for (const s of ep.server_data || []) {
          if (s?.link_m3u8 === link) return true;
        }
      }
      return false;
    },
    [movie.episodes]
  );

  const buildProgressData = useCallback(
    (time: number) => ({
      position: time,
      episodeIndex: progressRef.current.episodeIndex,
      episodeLink: progressRef.current.episodeLink,
    }),
    []
  );

  // ===== SAVE PATHS =====

  const saveToLocalStorage = useCallback(
    (time: number) => {
      if (time <= 0) return;
      saveVideoProgress(movieId, buildProgressData(time));
    },
    [movieId, buildProgressData]
  );

  const syncToFirestore = useCallback(
    async (time: number) => {
      const currentUser = userRef.current;
      if (!currentUser || time <= 0) return;
      await firebaseServices.syncViewingProgress(currentUser.id, movieId, buildProgressData(time));
    },
    [movieId, buildProgressData]
  );

  // Always up-to-date ref for force-sync — used in event handlers to avoid stale closures
  const forceSyncRef = useRef<(time: number) => void>(() => {});
  forceSyncRef.current = (time: number) => {
    saveToLocalStorage(time);
    if (userRef.current) syncToFirestore(time);
  };

  // ===== SYNC LOCALSTORAGE → FIRESTORE ON LOGIN =====
  // When a guest logs in, push any saved localStorage progress up to Firestore immediately
  // so the data isn't orphaned. prevUserIdRef tracks the null → non-null transition.
  useEffect(() => {
    const wasGuest = prevUserIdRef.current === null;
    const justLoggedIn = wasGuest && !!user;
    prevUserIdRef.current = user?.id ?? null;

    if (!justLoggedIn) return;

    const stored = getVideoProgress(movieId);
    if (!stored || stored.position <= 0) return;
    firebaseServices.syncViewingProgress(user!.id, movieId, stored);
  }, [user, movieId]);

  // ===== REGISTER IN RECENT MOVIES LIST (logged users, once per session) =====
  useEffect(() => {
    if (!user) return;
    const entry: IRecentMovie = {
      userId: user.id,
      id: movie.movie._id,
      slug: movie.movie.slug,
      thumb_url: movie.movie.thumb_url,
      name: movie.movie.name,
      origin_name: movie.movie.origin_name,
      lang: movie.movie.lang,
      quality: movie.movie.quality,
    };
    firebaseServices.storeRecentMovies(entry, user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId, user?.id]);

  // ===== RESTORE PROGRESS =====

  // Logged users: Firestore first, localStorage as fallback.
  // Fallback handles: (a) no Firestore data yet (first visit / sync lag),
  // (b) user logged in on a different page after a guest session.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      let progress = await firebaseServices.getViewingProgress(user.id, movieId);

      if (!progress) {
        // Fallback to localStorage — opportunistically sync it to Firestore for next visit
        const stored = getVideoProgress(movieId);
        if (stored && stored.position > 0) {
          firebaseServices.syncViewingProgress(user.id, movieId, stored);
          progress = stored;
        }
      }

      if (cancelled || !progress) return;

      const { position, episodeIndex: epIdx, episodeLink: epLink } = progress;
      if (position < MIN_PROGRESS_TO_SHOW || hasRestoredRef.current) return;
      if (!isValidEpisodeLink(epLink)) return;

      hasRestoredRef.current = true;
      setRestoredProgress({ position, episodeIndex: epIdx, episodeLink: epLink });
      setTimeout(() => {
        if (!cancelled) setIsShowResumePrompt(true);
      }, 2000);
    })();

    return () => {
      cancelled = true;
    };
  }, [movieId, user?.id, isValidEpisodeLink]);

  // Guests: read from localStorage
  useEffect(() => {
    if (user) return;
    const stored = getVideoProgress(movieId);
    if (!stored || hasRestoredRef.current) return;

    const { position, episodeIndex: epIdx, episodeLink: epLink } = stored;
    if (position < MIN_PROGRESS_TO_SHOW || !isValidEpisodeLink(epLink)) return;

    hasRestoredRef.current = true;
    setRestoredProgress({ position, episodeIndex: epIdx, episodeLink: epLink });
    const t = setTimeout(() => setIsShowResumePrompt(true), 2000);
    return () => clearTimeout(t);
  }, [movieId, user, isValidEpisodeLink]);

  // ===== AUTO-SAVE: localStorage every 20s (both guest and logged users) =====
  useEffect(() => {
    const id = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused && video.currentTime > 0) {
        saveToLocalStorage(video.currentTime);
      }
    }, LS_INTERVAL_MS);
    return () => clearInterval(id);
  }, [saveToLocalStorage, videoRef]);

  // ===== AUTO-SYNC: Firestore every 60s (logged users only) =====
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused && video.currentTime > 0) {
        syncToFirestore(video.currentTime);
      }
    }, FS_INTERVAL_MS);
    return () => clearInterval(id);
  }, [user, syncToFirestore, videoRef]);

  // ===== FORCE SYNC ON PAUSE =====
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePause = () => {
      const time = video.currentTime;
      if (time > 0) forceSyncRef.current(time);
    };

    video.addEventListener('pause', handlePause);
    return () => video.removeEventListener('pause', handlePause);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef]);

  // ===== FORCE SYNC ON VISIBILITY CHANGE / PAGE HIDE / SPA UNMOUNT =====
  useEffect(() => {
    let lastSavedAt = 0;

    const debouncedForceSync = () => {
      const now = Date.now();
      if (now - lastSavedAt < 2000) return;
      lastSavedAt = now;
      const time = videoRef.current?.currentTime ?? 0;
      if (time > 0) forceSyncRef.current(time);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') debouncedForceSync();
    };

    // pagehide: for logged users use sendBeacon (survives tab/browser close);
    // for guests save directly to localStorage (synchronous).
    const handlePageHide = () => {
      const currentUser = userRef.current;
      const time = videoRef.current?.currentTime ?? 0;
      if (time <= 0) return;

      if (currentUser) {
        const payload = JSON.stringify({
          userId: currentUser.id,
          movieId,
          ...buildProgressData(time),
        });
        navigator.sendBeacon(
          '/api/progress/sync',
          new Blob([payload], { type: 'application/json' })
        );
      } else {
        saveVideoProgress(movieId, buildProgressData(time));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      // SPA unmount (Next.js Link navigation) — save to localStorage synchronously
      const time = videoRef.current?.currentTime ?? 0;
      if (time > 0) saveVideoProgress(movieId, buildProgressData(time));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId]);

  // ===== ACCEPT / REJECT RESUME =====

  const handleAcceptResume = useCallback(() => {
    const { position, episodeIndex: epIdx, episodeLink: epLink } = restoredProgress;

    if (setServerIndex && movie.episodes) {
      for (let i = 0; i < movie.episodes.length; i++) {
        const found = movie.episodes[i].server_data?.some((s) => s?.link_m3u8 === epLink);
        if (found) {
          setServerIndex(i);
          break;
        }
      }
    }

    setEpisodeIndex(epIdx);
    setEpisodeLink(epLink);
    setVideoProgress(position);
    setIsShowResumePrompt(false);
  }, [restoredProgress, setEpisodeIndex, setEpisodeLink, setServerIndex, movie.episodes]);

  const handleRejectResume = useCallback(() => {
    setIsShowResumePrompt(false);
  }, []);

  return {
    restoredProgress,
    isShowResumePrompt,
    handleAcceptResume,
    handleRejectResume,
    setVideoProgress,
    videoProgress,
  };
}
