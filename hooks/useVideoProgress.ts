'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import firebaseServices from 'services/firebase-services';
import { saveRecentMovie, getRecentMovie } from 'lib/recent-movies-storage';
import { analytics } from 'lib/posthog/events';
import type DetailMovie from 'types/detail-movie';
import type { IRecentMovie } from 'types/recent-movie';

/** Extract resume-prompt fields. Returns null when no usable progress. */
function toRestoredProgress(entry: IRecentMovie | null): {
  position: number;
  episodeIndex: number;
  episodeLink: string;
} | null {
  if (!entry || typeof entry.progressTime !== 'number' || entry.progressTime <= 0) {
    return null;
  }
  return {
    position: entry.progressTime,
    episodeIndex: entry.progressEpIndex ?? 0,
    episodeLink: entry.progressEpLink ?? '',
  };
}

const LS_INTERVAL_MS = 20_000;
const FS_INTERVAL_MS = 60_000;
const MIN_PROGRESS_TO_SHOW = 60;

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

  // Refs prevent stale closures in async callbacks and event handlers.
  const progressRef = useRef({ episodeIndex, episodeLink, serverIndex });
  progressRef.current = { episodeIndex, episodeLink, serverIndex };

  const userRef = useRef(user);
  userRef.current = user;

  const hasRestoredRef = useRef(false);

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

  /** Single shape used for both localStorage and Firestore writes. */
  const buildRecentMovieEntry = useCallback(
    (time: number): IRecentMovie => {
      const rawDuration = videoRef.current?.duration;
      const validDuration =
        typeof rawDuration === 'number' && isFinite(rawDuration) && rawDuration > 0
          ? rawDuration
          : undefined;
      return {
        id: movie.movie._id,
        slug: movie.movie.slug,
        thumb_url: movie.movie.thumb_url,
        name: movie.movie.name,
        origin_name: movie.movie.origin_name,
        lang: movie.movie.lang,
        quality: movie.movie.quality,
        progressTime: time,
        progressEpIndex: progressRef.current.episodeIndex,
        progressEpLink: progressRef.current.episodeLink,
        progressDuration: validDuration,
      };
    },
    [movie.movie, videoRef]
  );

  const saveToLocalStorage = useCallback(
    (time: number) => {
      if (time <= 0) return;
      saveRecentMovie(buildRecentMovieEntry(time));
    },
    [buildRecentMovieEntry]
  );

  const syncToFirestore = useCallback(
    async (time: number) => {
      const currentUser = userRef.current;
      if (!currentUser || time <= 0) return;
      await firebaseServices.updateWatchProgress(buildRecentMovieEntry(time), currentUser.id);
    },
    [buildRecentMovieEntry]
  );

  const forceSyncRef = useRef<(time: number) => void>(() => {});
  forceSyncRef.current = (time: number) => {
    saveToLocalStorage(time);
    if (userRef.current) syncToFirestore(time);
  };

  // Logged users: Firestore first, localStorage as fallback (handles sync
  // lag or a transient FS read failure).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const fsEntry = await firebaseServices.getRecentMovie(user.id, movieId);
      let progress = toRestoredProgress(fsEntry);

      if (!progress) {
        const lsEntry = getRecentMovie(movieId);
        progress = toRestoredProgress(lsEntry);
        if (progress && lsEntry) {
          firebaseServices.updateWatchProgress(lsEntry, user.id);
        }
      }

      if (cancelled || !progress) return;
      if (progress.position < MIN_PROGRESS_TO_SHOW || hasRestoredRef.current) return;
      if (!isValidEpisodeLink(progress.episodeLink)) return;

      hasRestoredRef.current = true;
      setRestoredProgress(progress);
      setTimeout(() => {
        if (!cancelled) setIsShowResumePrompt(true);
      }, 2000);
    })();

    return () => {
      cancelled = true;
    };
  }, [movieId, user?.id, isValidEpisodeLink]);

  // Guests: read from localStorage.
  useEffect(() => {
    if (user) return;
    const progress = toRestoredProgress(getRecentMovie(movieId));
    if (!progress || hasRestoredRef.current) return;
    if (progress.position < MIN_PROGRESS_TO_SHOW || !isValidEpisodeLink(progress.episodeLink)) return;

    hasRestoredRef.current = true;
    setRestoredProgress(progress);
    const t = setTimeout(() => setIsShowResumePrompt(true), 2000);
    return () => clearTimeout(t);
  }, [movieId, user, isValidEpisodeLink]);

  // Auto-save to localStorage every 20s (guest + auth).
  useEffect(() => {
    const id = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused && video.currentTime > 0) {
        saveToLocalStorage(video.currentTime);
      }
    }, LS_INTERVAL_MS);
    return () => clearInterval(id);
  }, [saveToLocalStorage, videoRef]);

  // Auto-sync to Firestore every 60s (auth only).
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

  // Force-sync on pause.
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

  // Force-sync on visibility hide / page hide / SPA unmount.
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

    // pagehide: auth → sendBeacon (survives tab close), guest → sync localStorage.
    const handlePageHide = () => {
      const currentUser = userRef.current;
      const time = videoRef.current?.currentTime ?? 0;
      if (time <= 0) return;

      if (currentUser) {
        const payload = JSON.stringify({
          userId: currentUser.id,
          movie: buildRecentMovieEntry(time),
        });
        navigator.sendBeacon(
          '/api/progress/sync',
          new Blob([payload], { type: 'application/json' })
        );
      } else {
        saveRecentMovie(buildRecentMovieEntry(time));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      const time = videoRef.current?.currentTime ?? 0;
      if (time > 0) saveRecentMovie(buildRecentMovieEntry(time));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId]);

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
    analytics.resumeAccepted(movieId, position);
  }, [restoredProgress, setEpisodeIndex, setEpisodeLink, setServerIndex, movie.episodes, movieId]);

  const handleRejectResume = useCallback(() => {
    setIsShowResumePrompt(false);
    analytics.resumeRejected(movieId, restoredProgress.position);
  }, [movieId, restoredProgress.position]);

  return {
    restoredProgress,
    isShowResumePrompt,
    handleAcceptResume,
    handleRejectResume,
    setVideoProgress,
    videoProgress,
  };
}
