'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { PlaybackSnapshot, VidsrcEvent, VidsrcStatus } from 'hooks/useVidsrcBridge';

/**
 * The `<video>`-element twin of `useVidsrcBridge`.
 *
 * The watch page has two playback surfaces: the in-house hls.js player
 * (the catalog streams) and the vidsrc iframe (the fallback). Watch progress and
 * analytics were written against the iframe bridge's shape — a polled
 * `playbackRef` snapshot plus a stream of `{status, progress, duration}`
 * events — so this hook produces exactly that shape from media-element
 * events. Neither consumer needs to know which surface is on screen.
 *
 * `timeupdate` fires several times a second; events are forwarded at most
 * every five seconds (the iframe's own cadence) except for status changes,
 * which go out immediately.
 */

const PROGRESS_EVENT_INTERVAL_MS = 5000;

const INITIAL: PlaybackSnapshot = {
  currentTime: 0,
  duration: 0,
  status: 'idle',
  hasStarted: false,
};

export interface UseVideoElementBridgeOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Pass false while the iframe fallback is on screen. */
  enabled: boolean;
  onEvent?: (event: VidsrcEvent) => void;
  onStatusChange?: (status: VidsrcStatus, snapshot: PlaybackSnapshot) => void;
}

export function useVideoElementBridge({
  videoRef,
  enabled,
  onEvent,
  onStatusChange,
}: UseVideoElementBridgeOptions) {
  const playbackRef = useRef<PlaybackSnapshot>({ ...INITIAL });
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  useEffect(() => {
    if (!enabled) return;
    const video = videoRef.current;
    if (!video) return;

    let lastEmit = 0;

    const emit = (status: VidsrcStatus, force: boolean) => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const previous = playbackRef.current.status;
      playbackRef.current = {
        currentTime: video.currentTime > 0 ? video.currentTime : playbackRef.current.currentTime,
        duration: duration > 0 ? duration : playbackRef.current.duration,
        status,
        hasStarted: playbackRef.current.hasStarted || status === 'playing',
      };

      const now = Date.now();
      if (!force && now - lastEmit < PROGRESS_EVENT_INTERVAL_MS) return;
      lastEmit = now;

      onEventRef.current?.({
        status,
        progress: playbackRef.current.currentTime,
        duration: playbackRef.current.duration,
        info: null,
      });
      if (status !== previous) onStatusChangeRef.current?.(status, playbackRef.current);
    };

    const onPlaying = () => emit('playing', true);
    const onTimeUpdate = () => {
      if (!video.paused) emit('playing', false);
    };
    const onPause = () => {
      // `pause` also fires right before `ended`; let `ended` win.
      if (!video.ended) emit('paused', true);
    };
    const onEnded = () => emit('completed', true);
    const onSeeked = () => emit(video.paused ? 'paused' : 'playing', true);

    video.addEventListener('playing', onPlaying);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('seeked', onSeeked);
    return () => {
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('seeked', onSeeked);
    };
  }, [enabled, videoRef]);

  const reset = useCallback(() => {
    playbackRef.current = { ...INITIAL };
  }, []);

  return { playbackRef, reset };
}
