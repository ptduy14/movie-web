'use client';

import { useEffect, useRef, useState } from 'react';
import { usePlayerState } from 'hooks/usePlayerState';
import { useAutoHideControls } from 'hooks/useAutoHideControls';
import { useKeyboardShortcuts } from 'hooks/useKeyboardShortcuts';
import { PlayerProvider, type PlayerMeta } from './player-context';
import TopBar from './top-bar';
import CenterControls from './center-controls';
import BottomBar from './bottom-bar';
import BufferingSpinner from './buffering-spinner';

const DOUBLE_TAP_MS = 280;
const SEEK_FEEDBACK_MS = 600;

export interface VideoControlsOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  meta: PlayerMeta;
  /** When true (initial state before stream is ready), overlay sits dormant. */
  disabled?: boolean;
}

/**
 * Custom controls overlay. Renders absolute over the <video> element. Owns the
 * player state, keyboard shortcuts, auto-hide, and tap/double-tap gestures.
 *
 * IMPORTANT: this component MUST NOT replace, wrap, or proxy the <video>
 * element. `useVideoProgress` and `useWatchAnalytics` listen directly on the
 * `videoRef` and rely on the element identity being stable.
 */
export default function VideoControlsOverlay({
  videoRef,
  containerRef,
  meta,
  disabled = false,
}: VideoControlsOverlayProps) {
  const { state, actions } = usePlayerState(videoRef);
  const { visible, bindContainer } = useAutoHideControls({
    isPlaying: state.isPlaying,
    isBuffering: state.isBuffering,
    isEnded: state.isEnded,
  });

  useKeyboardShortcuts({ containerRef, state, actions });

  // Tap/double-tap state for the click-through layer.
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [seekFlash, setSeekFlash] = useState<'left' | 'right' | null>(null);

  // Hide native cursor when overlay auto-hides on desktop.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.style.cursor = visible ? '' : 'none';
  }, [visible, containerRef]);

  if (disabled) return null;

  const handleTapSurface = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore clicks that bubbled from a real control.
    if (e.target !== e.currentTarget) return;

    const now = performance.now();
    const last = lastTapRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    const isDouble =
      last !== null &&
      now - last.time < DOUBLE_TAP_MS &&
      Math.abs(x - last.x) < 40 &&
      Math.abs(y - last.y) < 40;

    if (isDouble) {
      // Cancel the pending single-tap action.
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
        singleTapTimer.current = null;
      }
      lastTapRef.current = null;

      if (e.pointerType === 'touch') {
        // Mobile double-tap → zone-based seek with ripple.
        const isLeft = x - rect.left < rect.width / 2;
        actions.seekBy(isLeft ? -10 : 10);
        setSeekFlash(isLeft ? 'left' : 'right');
        setTimeout(() => setSeekFlash(null), SEEK_FEEDBACK_MS);
      } else {
        // Desktop double-click → fullscreen.
        actions.toggleFullscreen(containerRef.current);
      }
      return;
    }

    // Single tap — defer to see if a second tap arrives.
    lastTapRef.current = { time: now, x, y };
    if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
    singleTapTimer.current = setTimeout(() => {
      // On mobile, a single tap reveals controls — don't toggle play.
      // On desktop, a single click toggles play (no delay penalty in practice
      // because DOUBLE_TAP_MS is short).
      if (e.pointerType !== 'touch') {
        actions.toggle();
      }
      singleTapTimer.current = null;
      lastTapRef.current = null;
    }, DOUBLE_TAP_MS);
  };

  return (
    <PlayerProvider value={{ state, actions, videoRef, containerRef, meta }}>
      {/* Click-through tap layer — captures gestures, lets descendant controls
          stop propagation by virtue of being separate event targets. */}
      <div
        className="absolute inset-0 z-10"
        onPointerDown={handleTapSurface}
        {...bindContainer}
      >
        <BufferingSpinner />

        {/* Mobile seek-ripple feedback */}
        {seekFlash && (
          <div
            className={`pointer-events-none absolute inset-y-0 flex items-center justify-center ${
              seekFlash === 'left' ? 'left-0 w-1/2' : 'right-0 w-1/2'
            }`}
          >
            <div className="rounded-full bg-white/15 px-5 py-3 text-sm font-semibold text-ink-primary backdrop-blur-sm">
              {seekFlash === 'left' ? '−10s' : '+10s'}
            </div>
          </div>
        )}

        {/* Controls chrome — fades in/out as a single unit. */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ease-out-expo ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <TopBar />
          {/* Center controls only visible when paused/ended OR when chrome is up.
              Showing them during playback all the time is too noisy. */}
          {(!state.isPlaying || visible) && <CenterControls />}
          <BottomBar />
        </div>
      </div>
    </PlayerProvider>
  );
}
