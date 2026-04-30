'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setProgress } from '../redux/slices/progress-slice';
import firebaseServices from 'services/firebase-services';
import type DetailMovie from 'types/detail-movie';
import type { IRecentMovie } from 'types/recent-movie';

const AUTO_SAVE_INTERVAL_MS = 20000; // 20 seconds
const MIN_PROGRESS_TO_SHOW_NOTIFICATION = 60; // Chỉ hiện noti nếu đã xem > 60s

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

function buildProgressPayload(
  movie: DetailMovie,
  currentTime: number,
  episodeIndex: number,
  episodeLink: string,
  defaultEpLink: string
) {
  return {
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
  const progress = useSelector((state: any) => state.progress.progress);
  const dispatch = useDispatch();

  const [previousWatchProgress, setPreviousWatchProgress] = useState<PreviousWatchProgress>({
    progressTime: 0,
    progressEpIndex: 0,
    progressEpLink: '',
  });
  const [isShowToastProgress, setIsShowToastProgress] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);

  // Refs để tránh stale closure trong event handlers
  const progressRef = useRef({ episodeIndex, episodeLink, serverIndex });
  progressRef.current = { episodeIndex, episodeLink, serverIndex };

  const movieIdRef = useRef(movie.movie._id);
  movieIdRef.current = movie.movie._id;

  const hasShownRestoreRef = useRef(false);

  const defaultEpLink = movie.episodes?.[0]?.server_data?.[0]?.link_m3u8 || '';

  const saveProgress = useCallback(
    (currentTime?: number) => {
      const video = videoRef.current;
      const time = currentTime ?? video?.currentTime ?? 0;

      if (time <= 0 || !movieIdRef.current) return;

      const { episodeIndex: epIdx, episodeLink: epLink } = progressRef.current;

      // Guest: lưu Redux (persist -> localStorage)
      if (!user) {
        dispatch(
          setProgress({
            id: movie.movie._id,
            slug: movie.movie.slug,
            thumb_url: movie.movie.thumb_url,
            name: movie.movie.name,
            origin_name: movie.movie.origin_name,
            lang: movie.movie.lang,
            quality: movie.movie.quality,
            progress: {
              progressTime: time,
              episodeIndex: epIdx,
              episodeLink: epLink,
            },
          })
        );
        return;
      }

      // Logged-in: gửi lên API (Firestore)
      const recentMovieData: IRecentMovie = {
        userId: user.id,
        ...buildProgressPayload(movie, time, epIdx, epLink, defaultEpLink),
      };
      const blob = new Blob([JSON.stringify(recentMovieData)], {
        type: 'application/json',
      });
      navigator.sendBeacon('/api/movies/store-recent-movie', blob);
    },
    [user, movie, defaultEpLink, dispatch, videoRef]
  );

  const saveProgressToFirebase = useCallback(
    async (currentTime?: number) => {
      if (!user) return;

      const video = videoRef.current;
      const time = currentTime ?? video?.currentTime ?? 0;
      if (time <= 0) return;

      const { episodeIndex: epIdx, episodeLink: epLink } = progressRef.current;
      const recentMovie: IRecentMovie = {
        userId: user.id,
        ...buildProgressPayload(movie, time, epIdx, epLink, defaultEpLink),
      };
      await firebaseServices.updateWatchProgress(recentMovie, user.id);
    },
    [user, movie, defaultEpLink, videoRef]
  );

  // Validate episodeLink tồn tại trong movie (tránh detect sai phim)
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

  // Restore progress khi mount
  useEffect(() => {
    const movieId = movie.movie._id;

    const restoreUser = async () => {
      if (!user) return;
      const res: any = await firebaseServices.getProgressWatchOfMovie(user.id, movieId);
      if (!res?.status) return;

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
      setTimeout(() => setIsShowToastProgress(true), 2000);
    };

    const restoreGuest = () => {
      if (progress?.id !== movieId || hasShownRestoreRef.current) return;
      const p = progress.progress;
      if (!p || (p.progressTime ?? 0) < MIN_PROGRESS_TO_SHOW_NOTIFICATION) return;

      const epLink = p.episodeLink ?? '';
      if (!isValidEpisodeLink(epLink)) return;

      hasShownRestoreRef.current = true;
      setPreviousWatchProgress({
        progressEpIndex: p.episodeIndex ?? 0,
        progressTime: p.progressTime ?? 0,
        progressEpLink: epLink,
      });
      setTimeout(() => setIsShowToastProgress(true), 2000);
    };

    if (user) {
      restoreUser();
    } else {
      restoreGuest();
    }
  }, [movie.movie._id, user, progress, isValidEpisodeLink]);

  // Auto-save mỗi 20s (chỉ user đăng nhập -> Firebase)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused && video.currentTime > 0) {
        saveProgressToFirebase(video.currentTime);
      }
    }, AUTO_SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [user, saveProgressToFirebase, videoRef]);

  // Lưu khi: reload, đóng tab, ẩn tab, back
  useEffect(() => {
    const handleSave = () => saveProgress();

    window.addEventListener('beforeunload', handleSave);
    window.addEventListener('pagehide', handleSave);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveProgress();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handlePopState = () => saveProgress();
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleSave);
      window.removeEventListener('pagehide', handleSave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [saveProgress]);

  const handleAcceptProgressWatch = useCallback(() => {
    const { progressEpIndex, progressEpLink, progressTime } = previousWatchProgress;

    // Tìm serverIndex tương ứng với episodeLink đã lưu
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
