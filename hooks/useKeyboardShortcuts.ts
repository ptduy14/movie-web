'use client';

import { useEffect, useRef } from 'react';
import type { PlayerActions, PlayerState } from './usePlayerState';

/**
 * Industry-standard keyboard shortcuts (see docs/custom-video-controls.md §8).
 * Only fire when:
 *   - the player container is in the viewport (IntersectionObserver), AND
 *   - the focused element is not a text input / textarea / contenteditable.
 */
export interface UseKeyboardShortcutsOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  state: PlayerState;
  actions: PlayerActions;
  /** Fires when user hits N (next episode). Optional — wired in Phase 2. */
  onNextEpisode?: () => void;
  /** Step in seconds for ← / → */
  smallStep?: number;
  /** Step in seconds for J / L */
  bigStep?: number;
}

const VOLUME_STEP = 0.05;
const RATE_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

function isTextInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts({
  containerRef,
  state,
  actions,
  onNextEpisode,
  smallStep = 5,
  bigStep = 10,
}: UseKeyboardShortcutsOptions) {
  // Use refs to avoid re-binding the listener every render. The handler reads
  // fresh state via these refs.
  const stateRef = useRef(state);
  stateRef.current = state;
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const onNextRef = useRef(onNextEpisode);
  onNextRef.current = onNextEpisode;

  // Track in-viewport — shortcuts only apply when the player is visible. This
  // matters on long watch pages where the user might be scrolled to comments.
  const inViewportRef = useRef(true);
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) inViewportRef.current = entry.isIntersecting;
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [containerRef]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!inViewportRef.current) return;
      if (isTextInputFocused()) return;
      // Don't hijack modifier combos — leave Ctrl+R, Cmd+L, etc. alone.
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const a = actionsRef.current;
      const s = stateRef.current;
      const containerEl = containerRef.current;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          a.toggle();
          return;
        case 'j':
        case 'J':
          e.preventDefault();
          a.seekBy(-bigStep);
          return;
        case 'l':
        case 'L':
          e.preventDefault();
          a.seekBy(bigStep);
          return;
        case 'ArrowLeft':
          e.preventDefault();
          a.seekBy(-smallStep);
          return;
        case 'ArrowRight':
          e.preventDefault();
          a.seekBy(smallStep);
          return;
        case 'ArrowUp':
          e.preventDefault();
          a.setVolume(s.volume + VOLUME_STEP);
          return;
        case 'ArrowDown':
          e.preventDefault();
          a.setVolume(s.volume - VOLUME_STEP);
          return;
        case 'm':
        case 'M':
          e.preventDefault();
          a.toggleMute();
          return;
        case 'f':
        case 'F':
          e.preventDefault();
          a.toggleFullscreen(containerEl);
          return;
        case '<':
        case ',': {
          e.preventDefault();
          const idx = RATE_STEPS.findIndex((r) => r >= s.playbackRate);
          const next = RATE_STEPS[Math.max(0, idx - 1)];
          a.setRate(next);
          return;
        }
        case '>':
        case '.': {
          e.preventDefault();
          const idx = RATE_STEPS.findIndex((r) => r >= s.playbackRate);
          const next = RATE_STEPS[Math.min(RATE_STEPS.length - 1, idx + 1)];
          a.setRate(next);
          return;
        }
        case 'p':
        case 'P': {
          e.preventDefault();
          const video = (containerEl?.querySelector('video') as HTMLVideoElement | null);
          if (!video) return;
          if (document.pictureInPictureElement) {
            document.exitPictureInPicture().catch(() => {});
          } else {
            (video as any).requestPictureInPicture?.().catch?.(() => {});
          }
          return;
        }
        case 'n':
        case 'N':
          e.preventDefault();
          onNextRef.current?.();
          return;
      }

      // Digit keys 0–9 → jump to that decile.
      if (e.key >= '0' && e.key <= '9') {
        const pct = parseInt(e.key, 10) / 10;
        if (s.duration > 0) {
          e.preventDefault();
          a.seek(s.duration * pct);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [containerRef, bigStep, smallStep]);
}
