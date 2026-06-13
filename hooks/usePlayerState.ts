'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isTouchDevice } from 'utils/mobile-fullscreen';

/**
 * Subscribes to the <video> element's media events and returns derived state +
 * imperative actions. This is the single source of truth for the custom
 * controls overlay.
 *
 * The hook NEVER replaces or proxies the element — `useVideoProgress` and
 * `useWatchAnalytics` keep working unchanged because they read from the same
 * `videoRef` via their own `addEventListener` calls.
 */
export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  /** End-of-buffered-range that contains the current playhead (0 if none). */
  bufferedEnd: number;
  volume: number; // 0..1
  muted: boolean;
  playbackRate: number;
  isBuffering: boolean;
  isSeeking: boolean;
  isEnded: boolean;
  isFullscreen: boolean;
}

export interface PlayerActions {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (t: number) => void;
  seekBy: (delta: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setRate: (r: number) => void;
  toggleFullscreen: (container: HTMLElement | null) => void;
}

const BUFFER_FLICKER_MS = 200;

function bufferedEndAt(video: HTMLVideoElement | null, t: number): number {
  if (!video || !video.buffered || video.buffered.length === 0) return 0;
  for (let i = 0; i < video.buffered.length; i++) {
    if (t >= video.buffered.start(i) && t <= video.buffered.end(i)) {
      return video.buffered.end(i);
    }
  }
  // No range contains `t` — return the latest range's end as a hint.
  return video.buffered.end(video.buffered.length - 1);
}

export function usePlayerState(
  videoRef: React.RefObject<HTMLVideoElement | null>
): { state: PlayerState; actions: PlayerActions } {
  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    bufferedEnd: 0,
    volume: 1,
    muted: false,
    playbackRate: 1,
    isBuffering: false,
    isSeeking: false,
    isEnded: false,
    isFullscreen: false,
  });

  // Debounce buffering flag to avoid flicker on small stalls (<200ms).
  const bufferingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearBufferingTimer = () => {
    if (bufferingTimer.current) {
      clearTimeout(bufferingTimer.current);
      bufferingTimer.current = null;
    }
  };

  // Subscribe to media events.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const sync = (patch: Partial<PlayerState>) => setState((s) => ({ ...s, ...patch }));

    const handlePlay = () => sync({ isPlaying: true, isEnded: false });
    const handlePause = () => sync({ isPlaying: false });
    const handleTimeUpdate = () => {
      sync({
        currentTime: video.currentTime,
        bufferedEnd: bufferedEndAt(video, video.currentTime),
      });
    };
    const handleDurationChange = () => sync({ duration: video.duration || 0 });
    const handleLoadedMetadata = () => sync({ duration: video.duration || 0 });
    const handleVolumeChange = () =>
      sync({ volume: video.volume, muted: video.muted });
    const handleRateChange = () => sync({ playbackRate: video.playbackRate });
    const handleWaiting = () => {
      clearBufferingTimer();
      bufferingTimer.current = setTimeout(
        () => sync({ isBuffering: true }),
        BUFFER_FLICKER_MS
      );
    };
    const handlePlaying = () => {
      clearBufferingTimer();
      sync({ isBuffering: false });
    };
    const handleSeeking = () => sync({ isSeeking: true });
    const handleSeeked = () => sync({ isSeeking: false });
    const handleEnded = () => sync({ isEnded: true, isPlaying: false });
    const handleProgress = () =>
      sync({ bufferedEnd: bufferedEndAt(video, video.currentTime) });

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('ratechange', handleRateChange);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('progress', handleProgress);

    // Seed initial state from whatever the element already has (e.g. resumed
    // playback). Without this, mute/volume restored by the browser would be
    // wrong in the UI until the user touches a control.
    sync({
      isPlaying: !video.paused,
      currentTime: video.currentTime,
      duration: video.duration || 0,
      volume: video.volume,
      muted: video.muted,
      playbackRate: video.playbackRate,
    });

    return () => {
      clearBufferingTimer();
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('ratechange', handleRateChange);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('progress', handleProgress);
    };
  }, [videoRef]);

  // Track fullscreen state separately — it lives on `document`, not `video`.
  useEffect(() => {
    const handleFsChange = () => {
      const fs = !!document.fullscreenElement || !!(document as any).webkitFullscreenElement;
      setState((s) => ({ ...s, isFullscreen: fs }));
      // Lock to landscape on mobile when entering fullscreen; release on exit.
      // iOS rejects the lock API but rotates natively, so this is best-effort.
      const orientation = (typeof screen !== 'undefined' ? screen.orientation : undefined) as any;
      if (orientation?.lock) {
        if (fs && isTouchDevice()) orientation.lock('landscape').catch(() => {});
        else if (!fs) {
          try {
            orientation.unlock?.();
          } catch {
            /* noop */
          }
        }
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange as any);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange as any);
    };
  }, []);

  // ---- Actions ----
  const play = useCallback(() => {
    videoRef.current?.play().catch(() => {});
  }, [videoRef]);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, [videoRef]);

  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, [videoRef]);

  const seek = useCallback(
    (t: number) => {
      const v = videoRef.current;
      if (!v) return;
      const clamped = Math.max(0, Math.min(t, v.duration || t));
      v.currentTime = clamped;
    },
    [videoRef]
  );

  const seekBy = useCallback(
    (delta: number) => {
      const v = videoRef.current;
      if (!v) return;
      seek(v.currentTime + delta);
    },
    [videoRef, seek]
  );

  const setVolume = useCallback(
    (v: number) => {
      const video = videoRef.current;
      if (!video) return;
      const clamped = Math.max(0, Math.min(1, v));
      video.volume = clamped;
      if (clamped > 0 && video.muted) video.muted = false;
    },
    [videoRef]
  );

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
  }, [videoRef]);

  const setRate = useCallback(
    (r: number) => {
      const v = videoRef.current;
      if (!v) return;
      v.playbackRate = r;
    },
    [videoRef]
  );

  const toggleFullscreen = useCallback(
    (container: HTMLElement | null) => {
      const v = videoRef.current;
      if (!container && !v) return;

      // Already fullscreen → exit.
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
        return;
      }

      // iOS Safari does not support Element.requestFullscreen on arbitrary
      // elements — only HTMLVideoElement.webkitEnterFullscreen works.
      const iosVideo = v as any;
      if (typeof iosVideo?.webkitEnterFullscreen === 'function' && !container?.requestFullscreen) {
        iosVideo.webkitEnterFullscreen();
        return;
      }

      const target = container || v;
      const req = (target as any)?.requestFullscreen || (target as any)?.webkitRequestFullscreen;
      req?.call(target).catch?.(() => {});
    },
    [videoRef]
  );

  return {
    state,
    actions: { play, pause, toggle, seek, seekBy, setVolume, toggleMute, setRate, toggleFullscreen },
  };
}
