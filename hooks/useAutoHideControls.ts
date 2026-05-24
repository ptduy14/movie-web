'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Controls overlay visibility logic:
 *   - Always visible while paused, buffering, ended, or when something inside
 *     the overlay has keyboard focus (a11y critical).
 *   - While playing, hide after `idleMs` of no mouse movement / touch.
 *   - Any pointer activity inside the container resets the timer.
 */
export interface UseAutoHideOptions {
  isPlaying: boolean;
  isBuffering: boolean;
  isEnded: boolean;
  /** Hold-open trigger from outside (e.g. settings menu open). */
  forceVisible?: boolean;
  idleMs?: number;
}

export interface UseAutoHideReturn {
  visible: boolean;
  /** Attach to the player container — listens for pointer/touch/focus events. */
  onActivity: () => void;
  /** Set on the container as React event handlers. */
  bindContainer: {
    onMouseMove: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onTouchStart: () => void;
    onFocus: () => void;
    onBlur: (e: React.FocusEvent) => void;
  };
}

const DEFAULT_IDLE_MS = 3000;

export function useAutoHideControls({
  isPlaying,
  isBuffering,
  isEnded,
  forceVisible = false,
  idleMs = DEFAULT_IDLE_MS,
}: UseAutoHideOptions): UseAutoHideReturn {
  const [visible, setVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveringRef = useRef(false);

  const clear = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const shouldStayOpen = useCallback(() => {
    if (!isPlaying) return true;
    if (isBuffering || isEnded) return true;
    if (forceVisible) return true;
    if (hoveringRef.current) return true;
    return false;
  }, [isPlaying, isBuffering, isEnded, forceVisible]);

  const scheduleHide = useCallback(() => {
    clear();
    if (shouldStayOpen()) {
      setVisible(true);
      return;
    }
    timer.current = setTimeout(() => setVisible(false), idleMs);
  }, [idleMs, shouldStayOpen]);

  const onActivity = useCallback(() => {
    setVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  // Re-evaluate whenever the inputs change (e.g. user paused → keep visible).
  useEffect(() => {
    setVisible(true);
    scheduleHide();
    return clear;
  }, [scheduleHide]);

  const bindContainer = {
    onMouseMove: onActivity,
    onMouseEnter: () => {
      hoveringRef.current = true;
      onActivity();
    },
    onMouseLeave: () => {
      hoveringRef.current = false;
      scheduleHide();
    },
    onTouchStart: onActivity,
    onFocus: onActivity,
    onBlur: (e: React.FocusEvent) => {
      // Only schedule hide if focus is leaving the entire container.
      const next = e.relatedTarget as Node | null;
      const root = e.currentTarget as Node;
      if (!next || !root.contains(next)) {
        scheduleHide();
      }
    },
  };

  return { visible, onActivity, bindContainer };
}
