'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

/**
 * Keyboard-shortcut help overlay. Toggled by the `?` key (see §8 of
 * docs/custom-video-controls.md) and dismissed via Escape, click-outside, or
 * the close button. Desktop-oriented — there's no physical keyboard to drive
 * it on mobile, but it stays harmless if it ever surfaces there.
 */
export interface KeyboardHintProps {
  open: boolean;
  onClose: () => void;
}

// Each row: the keycaps to render + the i18n key for its action label. Keep in
// sync with the switch in hooks/useKeyboardShortcuts.ts.
const SHORTCUTS: { keys: string[]; labelKey: string }[] = [
  { keys: ['Space', 'K'], labelKey: 'playPause' },
  { keys: ['J'], labelKey: 'back10' },
  { keys: ['L'], labelKey: 'forward10' },
  { keys: ['←', '→'], labelKey: 'seek5' },
  { keys: ['↑', '↓'], labelKey: 'volume' },
  { keys: ['M'], labelKey: 'mute' },
  { keys: ['F'], labelKey: 'fullscreen' },
  { keys: ['<', '>'], labelKey: 'speed' },
  { keys: ['0', '–', '9'], labelKey: 'jump' },
  { keys: ['P'], labelKey: 'pip' },
  { keys: ['N'], labelKey: 'nextEpisode' },
  { keys: ['?'], labelKey: 'help' },
];

export default function KeyboardHint({ open, onClose }: KeyboardHintProps) {
  const t = useTranslations('watch.player.shortcuts');
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Escape closes. The `?` toggle is handled in useKeyboardShortcuts, so this
  // only needs to catch Escape here.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <div
      // z-40 — sits above settings (z-30) so the help is always reachable.
      className={`absolute inset-0 z-40 flex items-center justify-center p-4 transition-opacity duration-200 ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onPointerDown={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        className={`relative max-h-full w-full max-w-md overflow-y-auto rounded-xl bg-black/90 p-4 text-ink-primary shadow-custom backdrop-blur-md ring-1 ring-white/10 transition-all duration-250 ease-out-expo lg:p-5 ${
          open ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold lg:text-base">{t('title')}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="rounded p-1 text-ink-secondary outline-none transition-colors hover:bg-surface-chip hover:text-ink-primary focus-visible:bg-surface-chip"
          >
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M3 3l8 8M11 3l-8 8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {SHORTCUTS.map(({ keys, labelKey }) => (
            <li
              key={labelKey}
              className="flex items-center justify-between gap-3 rounded-md px-1.5 py-1"
            >
              <span className="text-xs text-ink-secondary lg:text-sm">{t(labelKey)}</span>
              <span className="flex shrink-0 items-center gap-1">
                {keys.map((k) =>
                  k === '–' ? (
                    <span key={k} className="text-ink-disabled">
                      –
                    </span>
                  ) : (
                    <kbd
                      key={k}
                      className="min-w-[1.5rem] rounded border border-white/15 bg-surface-chip px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none text-ink-primary"
                    >
                      {k}
                    </kbd>
                  )
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
