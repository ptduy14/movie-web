'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { vidsrcOrigin } from 'services/vidsrc-service';

/**
 * The `postMessage` channel to the vidsrc player.
 *
 * Playback now happens inside a cross-origin iframe, so there is no
 * `<video>` element to attach listeners to. Everything the app used to read
 * off the media element — current time, duration, play/pause — arrives as
 * messages instead, and this hook turns that stream back into something the
 * rest of the app can poll.
 *
 * ## Why a ref, not state
 *
 * The player emits a progress event roughly every five seconds, and the two
 * consumers (watch-progress persistence and analytics) only ever sample the
 * latest value. Holding it in React state would re-render the whole watch
 * page on every tick for no visual change, so the snapshot lives in a ref and
 * only genuinely visual facts (season/episode reported by the player) are
 * state.
 *
 * ## Documented vs observed
 *
 * `PLAYER_EVENT` is the provider's published contract. `TV_INFO`, `TV_STATE`
 * and `TV_SET` are not documented — they were read out of the embed page's
 * own relay script. They are genuinely useful (they let the app drive episode
 * changes without reloading the frame) but they can disappear without notice,
 * so every use of them has a fallback that reloads the iframe instead.
 */

export type VidsrcStatus = 'idle' | 'playing' | 'paused' | 'completed' | 'seeked';

export interface PlaybackSnapshot {
  /** Seconds into the current title. */
  currentTime: number;
  /** Total seconds, or 0 before the player reports one. */
  duration: number;
  status: VidsrcStatus;
  /** True once the player has reported any playback at all. */
  hasStarted: boolean;
}

export interface VidsrcPlayerInfo {
  imdb: string | null;
  tmdb: string | null;
  mediaType: 'movie' | 'tv';
  season: number | null;
  episode: number | null;
}

export interface VidsrcEvent {
  status: VidsrcStatus;
  progress: number;
  duration: number;
  info: VidsrcPlayerInfo | null;
}

export interface UseVidsrcBridgeOptions {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  /** Fired on every player event, after the snapshot has been updated. */
  onEvent?: (event: VidsrcEvent) => void;
  /** Fired once per status transition (playing → paused, etc.). */
  onStatusChange?: (status: VidsrcStatus, snapshot: PlaybackSnapshot) => void;
}

export interface UseVidsrcBridgeReturn {
  /** Latest playback snapshot. Read `.current`; never triggers a re-render. */
  playbackRef: React.RefObject<PlaybackSnapshot>;
  /** Season/episode the player says it is on, when it reports one. */
  playerPosition: { season: number; episode: number } | null;
  /**
   * Ask the player to switch episode without reloading the frame.
   * Returns false when the channel isn't usable, so the caller can fall back
   * to pointing the iframe at a new URL.
   */
  requestEpisode: (season: number, episode: number) => boolean;
  /** Reset the snapshot — call when the embedded URL changes. */
  reset: () => void;
}

const INITIAL: PlaybackSnapshot = {
  currentTime: 0,
  duration: 0,
  status: 'idle',
  hasStarted: false,
};

function readEvent(data: any): VidsrcEvent | null {
  if (!data || data.type !== 'PLAYER_EVENT' || !data.data) return null;
  const d = data.data;
  const status = d.player_status;
  if (
    status !== 'playing' &&
    status !== 'paused' &&
    status !== 'completed' &&
    status !== 'seeked'
  ) {
    return null;
  }
  return {
    status,
    progress: Number(d.player_progress) || 0,
    duration: Number(d.player_duration) || 0,
    info: d.player_info ?? null,
  };
}

export function useVidsrcBridge({
  iframeRef,
  onEvent,
  onStatusChange,
}: UseVidsrcBridgeOptions): UseVidsrcBridgeReturn {
  const playbackRef = useRef<PlaybackSnapshot>({ ...INITIAL });
  const [playerPosition, setPlayerPosition] = useState<{ season: number; episode: number } | null>(
    null
  );

  // Keep callbacks in refs so the message listener is attached once and never
  // torn down mid-playback by a parent re-render.
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  useEffect(() => {
    const expectedOrigin = vidsrcOrigin();

    const handler = (event: MessageEvent) => {
      // The page hosts one third-party frame and receives messages from
      // browser extensions and its own analytics too, so check the origin
      // before trusting anything in the payload.
      if (event.origin !== expectedOrigin) return;

      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'TV_STATE' || data.type === 'TV_INFO') {
        const season = Number(data.season);
        const episode = Number(data.episode);
        if (Number.isFinite(season) && Number.isFinite(episode)) {
          setPlayerPosition({ season, episode });
        }
        return;
      }

      const parsed = readEvent(data);
      if (!parsed) return;

      const previousStatus = playbackRef.current.status;
      playbackRef.current = {
        // A `completed` event can arrive with progress reset; keep the last
        // known good time so the final save isn't written as 0.
        currentTime: parsed.progress > 0 ? parsed.progress : playbackRef.current.currentTime,
        duration: parsed.duration > 0 ? parsed.duration : playbackRef.current.duration,
        status: parsed.status,
        hasStarted: true,
      };

      onEventRef.current?.(parsed);
      if (parsed.status !== previousStatus) {
        onStatusChangeRef.current?.(parsed.status, playbackRef.current);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const requestEpisode = useCallback(
    (season: number, episode: number) => {
      const frame = iframeRef.current;
      if (!frame?.contentWindow) return false;
      try {
        // Undocumented: the embed page relays anything the parent posts down
        // to the real player. If the provider drops this, the message is
        // simply ignored — hence the boolean return and the caller's fallback.
        frame.contentWindow.postMessage({ type: 'TV_SET', season, episode }, vidsrcOrigin());
        return true;
      } catch {
        return false;
      }
    },
    [iframeRef]
  );

  const reset = useCallback(() => {
    playbackRef.current = { ...INITIAL };
    setPlayerPosition(null);
  }, []);

  return { playbackRef, playerPosition, requestEpisode, reset };
}
