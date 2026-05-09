'use client';

import { useEffect, useRef } from 'react';
import { analytics } from 'lib/posthog/events';

type ProgressMilestone = 25 | 50 | 75 | 95;
const MILESTONES: ProgressMilestone[] = [25, 50, 75, 95];

interface UseWatchAnalyticsOptions {
  movieId: string;
  episodeIndex: number;
  serverIndex: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function useWatchAnalytics({
  movieId,
  episodeIndex,
  serverIndex,
  videoRef,
}: UseWatchAnalyticsOptions) {
  const playStartedRef = useRef(false);
  const completedRef = useRef(false);
  const firedMilestonesRef = useRef<Set<ProgressMilestone>>(new Set());
  const playStartTsRef = useRef<number | null>(null);

  // Reset milestone tracking when movie / episode / server changes
  useEffect(() => {
    playStartedRef.current = false;
    completedRef.current = false;
    firedMilestonesRef.current = new Set();
    playStartTsRef.current = null;
  }, [movieId, episodeIndex, serverIndex]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      if (playStartedRef.current) return;
      playStartedRef.current = true;
      playStartTsRef.current = Date.now();
      analytics.moviePlayStarted(movieId, episodeIndex, serverIndex);
    };

    const handleTimeUpdate = () => {
      const { currentTime, duration } = video;
      if (!duration || duration <= 0) return;
      const percent = (currentTime / duration) * 100;

      for (const m of MILESTONES) {
        if (percent >= m && !firedMilestonesRef.current.has(m)) {
          firedMilestonesRef.current.add(m);
          analytics.moviePlayProgress(movieId, m);
        }
      }
    };

    const handleEnded = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      const watchDuration = playStartTsRef.current
        ? Math.round((Date.now() - playStartTsRef.current) / 1000)
        : Math.round(video.duration ?? 0);
      analytics.moviePlayCompleted(movieId, watchDuration);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [movieId, episodeIndex, serverIndex, videoRef]);
}
