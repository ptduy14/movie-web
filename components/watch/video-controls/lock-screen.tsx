'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePlayer } from './player-context';
import { LockIcon, UnlockIcon } from './icons';

const UNLOCK_HOLD_MS = 800;

/**
 * Mobile lock-screen. When `isLocked` is true:
 *   - A full-surface absorber blocks all taps/gestures except the unlock
 *     button (so accidental touches in-pocket do nothing).
 *   - The unlock button requires a press-and-hold to release — single-tap
 *     would defeat the purpose.
 *
 * The lock button itself lives in TopBar via the `LockToggleButton` export.
 */
export default function LockScreen() {
  const t = useTranslations('watch.player');
  const { isLocked, setIsLocked, state } = usePlayer();
  const [holdProgress, setHoldProgress] = useState(0);
  const [holding, setHolding] = useState(false);

  // Only show in fullscreen — locking in-page is pointless because the user
  // can just scroll away.
  const active = isLocked && state.isFullscreen;

  useEffect(() => {
    if (!holding) {
      setHoldProgress(0);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const pct = Math.min(1, elapsed / UNLOCK_HOLD_MS);
      setHoldProgress(pct);
      if (pct >= 1) {
        setIsLocked(false);
        setHolding(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [holding, setIsLocked]);

  if (!active) return null;

  return (
    // z-40 sits above settings menu (z-30), next-ep card (z-20), controls (z-10)
    // so it truly absorbs all input.
    <div className="pointer-events-auto absolute inset-0 z-40">
      <div className="absolute inset-0" aria-hidden />
      <button
        type="button"
        onPointerDown={() => setHolding(true)}
        onPointerUp={() => setHolding(false)}
        onPointerLeave={() => setHolding(false)}
        onPointerCancel={() => setHolding(false)}
        aria-label={t('lock.holdToUnlock')}
        className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-black/70 px-4 py-2.5 text-ink-primary backdrop-blur-sm transition-transform active:scale-95"
      >
        <span className="relative">
          <LockIcon size={20} />
          {/* Progress ring overlay during hold */}
          {holding && (
            <svg
              className="absolute inset-0 -m-1.5"
              width="32"
              height="32"
              viewBox="0 0 32 32"
              aria-hidden
            >
              <circle
                cx="16"
                cy="16"
                r="13"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.25"
                strokeWidth="2"
              />
              <circle
                cx="16"
                cy="16"
                r="13"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 13}
                strokeDashoffset={(1 - holdProgress) * 2 * Math.PI * 13}
                transform="rotate(-90 16 16)"
              />
            </svg>
          )}
        </span>
        <span className="text-xs font-semibold">{t('lock.holdToUnlock')}</span>
      </button>
    </div>
  );
}

/** Used by the top bar to toggle lock on. Renders only when in fullscreen. */
export function LockToggleButton() {
  const t = useTranslations('watch.player');
  const { isLocked, setIsLocked, state } = usePlayer();
  if (!state.isFullscreen || isLocked) return null;
  return (
    <button
      type="button"
      onClick={() => setIsLocked(true)}
      aria-label={t('lock.lock')}
      className="pointer-events-auto rounded-full bg-black/40 p-2 text-ink-primary backdrop-blur-sm transition-colors hover:bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
    >
      <UnlockIcon size={18} />
    </button>
  );
}
