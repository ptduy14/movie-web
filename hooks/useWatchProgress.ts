'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setProgress } from '../redux/slices/progress-slice';
import firebaseServices from 'services/firebase-services';
import type DetailMovie from 'types/detail-movie';
import type { IRecentMovie } from 'types/recent-movie';

const AUTO_SAVE_INTERVAL_MS = 20000; // 20 seconds
const MIN_PROGRESS_TO_SHOW_NOTIFICATION = 60; // Show resume notification only if watched > 60s

export interface PreviousWatchProgress {
  progressTime: number;
  progressEpIndex: number;
  progressEpLink: string;
}

export interface UseWatchProgressOptions {
  movie: DetailMovie;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  episodeIndex: number;
  episodeLink: string;
  serverIndex: number;
  setEpisodeIndex: React.Dispatch<React.SetStateAction<number>>;
  setEpisodeLink: React.Dispatch<React.SetStateAction<string>>;
  setServerIndex?: React.Dispatch<React.SetStateAction<number>>;
}

export interface UseWatchProgressReturn {
  previousWatchProgress: PreviousWatchProgress;
  isShowToastProgress: boolean;
  handleAcceptProgressWatch: () => void;
  handleRejectProgressWatch: () => void;
  setVideoProgress: React.Dispatch<React.SetStateAction<number | null>>;
  videoProgress: number | null;
}

function buildRecentMovie(
  movie: DetailMovie,
  currentTime: number,
  episodeIndex: number,
  episodeLink: string,
  defaultEpLink: string,
  userId?: string
): IRecentMovie {
  return {
    ...(userId ? { userId } : {}),
    id: movie.movie._id,
    slug: movie.movie.slug,
    thumb_url: movie.movie.thumb_url,
    name: movie.movie.name,
    origin_name: movie.movie.origin_name,
    lang: movie.movie.lang,
    quality: movie.movie.quality,
    progressEpIndex: episodeIndex,
    progressTime: currentTime,
    progressEpLink: episodeLink || defaultEpLink,
  };
}

export function useWatchProgress({
  movie,
  videoRef,
  episodeIndex,
  episodeLink,
  serverIndex,
  setEpisodeIndex,
  setEpisodeLink,
  setServerIndex,
}: UseWatchProgressOptions): UseWatchProgressReturn {
  const user = useSelector((state: any) => state.auth.user);
  const guestMovies = useSelector(
    (state: any) => state.progress?.movies as Record<string, IRecentMovie> | undefined
  );
  const dispatch = useDispatch();

  const [previousWatchProgress, setPreviousWatchProgress] = useState<PreviousWatchProgress>({
    progressTime: 0,
    progressEpIndex: 0,
    progressEpLink: '',
  });
  const [isShowToastProgress, setIsShowToastProgress] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);

  // Refs to avoid stale closures in event handlers
  const progressRef = useRef({ episodeIndex, episodeLink, serverIndex });
  progressRef.current = { episodeIndex, episodeLink, serverIndex };

  const movieIdRef = useRef(movie.movie._id);
  movieIdRef.current = movie.movie._id;

  const hasShownRestoreRef = useRef(false);

  const defaultEpLink = movie.episodes?.[0]?.server_data?.[0]?.link_m3u8 || '';

  // ===== SAVE PATHS =====

  // Guest: persist to Redux (redux-persist → localStorage)
  const saveGuestProgress = useCallback(
    (time: number) => {
      const { episodeIndex: epIdx, episodeLink: epLink } = progressRef.current;
      const recentMovie = buildRecentMovie(movie, time, epIdx, epLink, defaultEpLink);
      dispatch(setProgress(recentMovie));
    },
    [movie, defaultEpLink, dispatch]
  );

  // Logged-in: write to Firestore via SDK (auto-save & pause flows)
  const saveUserProgressFirebase = useCallback(
    async (time: number) => {
      if (!user) return;
      const { episodeIndex: epIdx, episodeLink: epLink } = progressRef.current;
      const recentMovie = buildRecentMovie(movie, time, epIdx, epLink, defaultEpLink, user.id);
      await firebaseServices.updateWatchProgress(recentMovie, user.id);
    },
    [user, movie, defaultEpLink]
  );

  // Persist while viewing (interval / pause): branch by auth state
  const saveProgressLive = useCallback(
    (currentTime?: number) => {
      const video = videoRef.current;
      const time = currentTime ?? video?.currentTime ?? 0;
      if (time <= 0 || !movieIdRef.current) return;

      if (!user) {
        saveGuestProgress(time);
      } else {
        saveUserProgressFirebase(time);
      }
    },
    [user, saveGuestProgress, saveUserProgressFirebase, videoRef]
  );

  // Persist on unload: must be synchronous. Guest → Redux; user → sendBeacon
  const saveProgressOnUnload = useCallback(() => {
    const video = videoRef.current;
    const time = video?.currentTime ?? 0;
    if (time <= 0 || !movieIdRef.current) return;

    if (!user) {
      saveGuestProgress(time);
      return;
    }

    const { episodeIndex: epIdx, episodeLink: epLink } = progressRef.current;
    const recentMovie = buildRecentMovie(movie, time, epIdx, epLink, defaultEpLink, user.id);
    const blob = new Blob([JSON.stringify(recentMovie)], { type: 'application/json' });
    navigator.sendBeacon('/api/movies/store-recent-movie', blob);
  }, [user, movie, defaultEpLink, saveGuestProgress, videoRef]);

  // ===== RESTORE =====

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

  // Restore for signed-in users (Firestore)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const movieId = movie.movie._id;

    (async () => {
      const res: any = await firebaseServices.getProgressWatchOfMovie(user.id, movieId);
      if (cancelled || !res?.status) return;

      const epLink = res.progressEpLink ?? '';
      const epIndex = res.progressEpIndex ?? 0;
      const progressTime = res.progressTime ?? 0;

      if (progressTime < MIN_PROGRESS_TO_SHOW_NOTIFICATION || hasShownRestoreRef.current) return;
      if (!isValidEpisodeLink(epLink)) return;

      hasShownRestoreRef.current = true;
      setPreviousWatchProgress({
        progressEpIndex: epIndex,
        progressTime,
        progressEpLink: epLink,
      });
      setTimeout(() => {
        if (!cancelled) setIsShowToastProgress(true);
      }, 2000);
    })();

    return () => {
      cancelled = true;
    };
  }, [movie.movie._id, user, isValidEpisodeLink]);

  // Restore for guests (Redux)
  useEffect(() => {
    if (user) return;
    const movieId = movie.movie._id;
    const stored = guestMovies?.[movieId];
    if (!stored || hasShownRestoreRef.current) return;

    const progressTime = stored.progressTime ?? 0;
    const epLink = stored.progressEpLink ?? '';
    const epIndex = stored.progressEpIndex ?? 0;

    if (progressTime < MIN_PROGRESS_TO_SHOW_NOTIFICATION) return;
    if (!isValidEpisodeLink(epLink)) return;

    hasShownRestoreRef.current = true;
    setPreviousWatchProgress({
      progressEpIndex: epIndex,
      progressTime,
      progressEpLink: epLink,
    });
    const t = setTimeout(() => setIsShowToastProgress(true), 2000);
    return () => clearTimeout(t);
  }, [movie.movie._id, user, guestMovies, isValidEpisodeLink]);

  // ===== AUTO-SAVE INTERVAL =====
  useEffect(() => {
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused && video.currentTime > 0) {
        saveProgressLive(video.currentTime);
      }
    }, AUTO_SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [saveProgressLive, videoRef]);

  // ===== SAVE ON UNLOAD / HIDE / SPA-UNMOUNT =====
  const saveOnUnloadRef = useRef(saveProgressOnUnload);
  saveOnUnloadRef.current = saveProgressOnUnload;

  useEffect(() => {
    let lastSaveAt = 0;
    const debouncedSave = () => {
      const now = Date.now();
      if (now - lastSaveAt < 2000) return;
      lastSaveAt = now;
      saveOnUnloadRef.current();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') debouncedSave();
    };

    window.addEventListener('pagehide', debouncedSave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', debouncedSave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Final save on component unmount (SPA navigation via Link)
      debouncedSave();
    };
  }, []);

  // ===== ACCEPT/REJECT =====
  const handleAcceptProgressWatch = useCallback(() => {
    const { progressEpIndex, progressEpLink, progressTime } = previousWatchProgress;

    if (setServerIndex && movie.episodes) {
      for (let i = 0; i < movie.episodes.length; i++) {
        const found = movie.episodes[i].server_data?.some((s) => s?.link_m3u8 === progressEpLink);
        if (found) {
          setServerIndex(i);
          break;
        }
      }
    }

    setEpisodeIndex(progressEpIndex);
    setEpisodeLink(progressEpLink);
    setVideoProgress(progressTime);
    setIsShowToastProgress(false);
  }, [previousWatchProgress, setEpisodeIndex, setEpisodeLink, setServerIndex, movie.episodes]);

  const handleRejectProgressWatch = useCallback(() => {
    setIsShowToastProgress(false);
  }, []);

  return {
    previousWatchProgress,
    isShowToastProgress,
    handleAcceptProgressWatch,
    handleRejectProgressWatch,
    setVideoProgress,
    videoProgress,
  };
}
