'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePlayer } from './player-context';
import { PlayIcon, SparklesIcon } from './icons';

/**
 * Floating bottom-right card. Shows when the remaining time crosses below
 * SHOW_THRESHOLD seconds, and counts down from COUNTDOWN_SECONDS once the
 * remaining time crosses COUNTDOWN_THRESHOLD seconds. If `autoPlayNext` is on,
 * triggers the next episode at countdown end. Otherwise sits visible until the
 * video actually ends or the user clicks "Play Now" / dismisses.
 */
const SHOW_THRESHOLD = 30; // seconds remaining
const COUNTDOWN_THRESHOLD = 10; // start counting at 10s
const COUNTDOWN_SECONDS = 10;

export default function NextEpisodeCard() {
  const t = useTranslations('watch.player');
  const { state, nextEpisode, onNextEpisode, autoPlayNext, isLocked } = usePlayer();
  const [dismissed, setDismissed] = useState(false);
  const triggeredRef = useRef(false);

  // Reset dismissed flag whenever we move to a new episode (currentTime resets
  // toward 0 from near-end → user advanced).
  useEffect(() => {
    if (state.currentTime < SHOW_THRESHOLD && dismissed) {
      setDismissed(false);
      triggeredRef.current = false;
    }
  }, [state.currentTime, dismissed]);

  const remaining = Math.max(0, state.duration - state.currentTime);
  const visible =
    !!nextEpisode &&
    !isLocked &&
    !dismissed &&
    state.duration > 0 &&
    remaining <= SHOW_THRESHOLD;

  const inCountdown = visible && remaining <= COUNTDOWN_THRESHOLD;
  const countdownLeft = inCountdown ? Math.max(0, Math.ceil(remaining)) : null;

  // When countdown hits 0 (or remaining ≤ 0), and autoPlayNext is on, advance.
  useEffect(() => {
    if (!visible || !autoPlayNext) return;
    if (triggeredRef.current) return;
    if (remaining <= 0.5) {
      triggeredRef.current = true;
      onNextEpisode();
    }
  }, [visible, autoPlayNext, remaining, onNextEpisode]);

  // SVG conic-gradient style ring — simpler than canvas. Computed as
  // remaining/COUNTDOWN_SECONDS, clamped.
  const ringPct = useMemo(() => {
    if (!inCountdown) return 0;
    return Math.max(0, Math.min(1, (COUNTDOWN_SECONDS - countdownLeft!) / COUNTDOWN_SECONDS));
  }, [inCountdown, countdownLeft]);

  if (!nextEpisode) return null;

  return (
    <div
      className={`pointer-events-none absolute bottom-20 right-4 z-20 transition-all duration-300 ease-out-expo lg:bottom-24 lg:right-6 ${
        visible
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0'
      }`}
      aria-hidden={!visible}
    >
      <div className="flex items-center gap-2 overflow-hidden rounded-xl bg-black/85 p-2 shadow-custom backdrop-blur-md ring-1 ring-white/10 lg:gap-3 lg:p-3">
        <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md bg-white/5 lg:h-16 lg:w-28">
          {nextEpisode.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={nextEpisode.thumbnail}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-brand">
            <SparklesIcon size={12} />
            {t('nextEpisode.upNext')}
          </div>
          <div className="line-clamp-1 text-xs font-semibold text-ink-primary lg:text-sm">
            {nextEpisode.label}
          </div>
          <button
            type="button"
            onClick={() => {
              triggeredRef.current = true;
              onNextEpisode();
            }}
            className="group mt-1 flex items-center gap-2 self-start rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold text-ink-primary transition-colors hover:bg-white/20 focus-visible:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          >
            <PlayIcon size={12} />
            {inCountdown && autoPlayNext
              ? t('nextEpisode.playInSeconds', { seconds: countdownLeft ?? 0 })
              : t('nextEpisode.playNow')}
            {inCountdown && autoPlayNext && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                className="-mr-0.5"
                aria-hidden
              >
                <circle
                  cx="7"
                  cy="7"
                  r="5.5"
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity="0.25"
                  strokeWidth="1.5"
                />
                <circle
                  cx="7"
                  cy="7"
                  r="5.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 5.5}
                  strokeDashoffset={(1 - ringPct) * 2 * Math.PI * 5.5}
                  transform="rotate(-90 7 7)"
                />
              </svg>
            )}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label={t('nextEpisode.dismiss')}
          className="ml-1 self-start rounded p-1 text-ink-secondary transition-colors hover:bg-surface-chip hover:text-ink-primary"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M3 3l8 8M11 3l-8 8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
