'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlayer } from './player-context';

/** Format seconds → mm:ss or h:mm:ss when >= 1h. */
export function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const total = Math.floor(s);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/**
 * Scrubber. Three layers stacked left-to-right within a track:
 *   1. buffered range (subtle white-ish)
 *   2. played range (brand red)
 *   3. invisible hit target spanning the whole track
 *
 * Hover/drag shows a tooltip with the target time.
 */
export default function ProgressBar() {
  const { state, actions } = usePlayer();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [hoverPct, setHoverPct] = useState<number | null>(null);
  const [draggingPct, setDraggingPct] = useState<number | null>(null);
  const wasPlayingRef = useRef(false);

  const duration = state.duration || 0;
  const safePct = duration > 0 ? (state.currentTime / duration) * 100 : 0;
  const bufPct = duration > 0 ? (state.bufferedEnd / duration) * 100 : 0;
  const activePct = draggingPct ?? safePct;

  const pctFromEvent = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return rect.width === 0 ? 0 : (x / rect.width) * 100;
  }, []);

  const seekToPct = useCallback(
    (pct: number) => {
      if (duration > 0) actions.seek((pct / 100) * duration);
    },
    [actions, duration]
  );

  // Pointer drag — uses global listeners so dragging outside the track still works.
  useEffect(() => {
    if (draggingPct === null) return;

    const handleMove = (e: PointerEvent) => {
      const pct = pctFromEvent(e.clientX);
      setDraggingPct(pct);
      setHoverPct(pct);
    };
    const handleUp = (e: PointerEvent) => {
      const pct = pctFromEvent(e.clientX);
      seekToPct(pct);
      setDraggingPct(null);
      if (wasPlayingRef.current) actions.play();
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [draggingPct, pctFromEvent, seekToPct, actions]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (duration === 0) return;
    wasPlayingRef.current = state.isPlaying;
    actions.pause();
    const pct = pctFromEvent(e.clientX);
    setDraggingPct(pct);
    setHoverPct(pct);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (draggingPct !== null) return; // global handler covers drags
    setHoverPct(pctFromEvent(e.clientX));
  };

  const onPointerLeave = () => {
    if (draggingPct === null) setHoverPct(null);
  };

  const tooltipPct = hoverPct ?? draggingPct;
  const tooltipTime = tooltipPct !== null && duration > 0 ? (tooltipPct / 100) * duration : 0;

  return (
    <div className="group relative w-full select-none py-2 lg:py-3">
      <div
        ref={trackRef}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(state.currentTime)}
        aria-valuetext={`${formatTime(state.currentTime)} of ${formatTime(duration)}`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className="relative h-1 w-full cursor-pointer rounded-full bg-white/20 transition-[height] duration-150 ease-out-expo group-hover:h-1.5"
      >
        {/* Buffered range */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white/30"
          style={{ width: `${Math.max(0, Math.min(100, bufPct))}%` }}
        />
        {/* Played range */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-brand"
          style={{ width: `${Math.max(0, Math.min(100, activePct))}%` }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand opacity-0 shadow-custom transition-opacity duration-150 group-hover:opacity-100"
          style={{ left: `${Math.max(0, Math.min(100, activePct))}%` }}
        />
        {/* Hover tooltip */}
        {tooltipPct !== null && (
          <div
            className="pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 rounded bg-black/80 px-2 py-1 text-xs font-medium text-ink-primary tabular-nums"
            style={{ left: `${Math.max(0, Math.min(100, tooltipPct))}%` }}
          >
            {formatTime(tooltipTime)}
          </div>
        )}
      </div>
    </div>
  );
}
