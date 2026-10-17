'use client';

import { useCallback, useEffect, useRef } from 'react';
import { analytics } from 'lib/posthog/events';
import type { VidsrcEvent } from 'hooks/useVidsrcBridge';

type ProgressMilestone = 25 | 50 | 75 | 95;
const MILESTONES: ProgressMilestone[] = [25, 50, 75, 95];

interface UseWatchAnalyticsOptions {
  movieId: string;
  episodeIndex: number;
  serverIndex: number;
}

export interface UseWatchAnalyticsReturn {
  /** Feed every player event here — wire it to the bridge's `onEvent`. */
  trackEvent: (event: VidsrcEvent) => void;
}

/**
 * Playback analytics, driven by player events in the `VidsrcEvent` shape.
 *
 * Both playback surfaces speak it: the vidsrc iframe natively (postMessage),
 * the hls.js player through `useVideoElementBridge`. Progress ticks arrive
 * about every five seconds either way — plenty for quarter-of-the-way
 * milestones and much cheaper than per-`timeupdate`.
 */
export function useWatchAnalytics({
  movieId,
  episodeIndex,
  serverIndex,
}: UseWatchAnalyticsOptions): UseWatchAnalyticsReturn {
  const playStartedRef = useRef(false);
  const completedRef = useRef(false);
  const firedMilestonesRef = useRef<Set<ProgressMilestone>>(new Set());
  const playStartTsRef = useRef<number | null>(null);

  // Keep the identifying context in a ref so `trackEvent` stays stable and
  // the bridge listener never needs re-attaching.
  const contextRef = useRef({ movieId, episodeIndex, serverIndex });
  contextRef.current = { movieId, episodeIndex, serverIndex };

  // Reset milestone tracking when title / episode / season changes.
  useEffect(() => {
    playStartedRef.current = false;
    completedRef.current = false;
    firedMilestonesRef.current = new Set();
    playStartTsRef.current = null;
  }, [movieId, episodeIndex, serverIndex]);

  const trackEvent = useCallback((event: VidsrcEvent) => {
    const ctx = contextRef.current;

    if (event.status === 'playing') {
      if (!playStartedRef.current) {
        playStartedRef.current = true;
        playStartTsRef.current = Date.now();
        analytics.moviePlayStarted(ctx.movieId, ctx.episodeIndex, ctx.serverIndex);
      }

      if (event.duration > 0) {
        const percent = (event.progress / event.duration) * 100;
        for (const m of MILESTONES) {
          if (percent >= m && !firedMilestonesRef.current.has(m)) {
            firedMilestonesRef.current.add(m);
            analytics.moviePlayProgress(ctx.movieId, m);
          }
        }
      }
      return;
    }

    if (event.status === 'completed' && !completedRef.current) {
      completedRef.current = true;
      const watchDuration = playStartTsRef.current
        ? Math.round((Date.now() - playStartTsRef.current) / 1000)
        : Math.round(event.duration);
      analytics.moviePlayCompleted(ctx.movieId, watchDuration);
    }
  }, []);

  return { trackEvent };
}
