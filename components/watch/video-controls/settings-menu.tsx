'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePlayer } from './player-context';
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon } from './icons';

/**
 * Stacked-panel settings menu. The gear icon opens a slide-up panel. Root level
 * shows three entries: Speed, Audio/Language, Auto-play next (toggle). Speed
 * and Audio open submenus that slide in from the right.
 *
 * Designed so adding new entries (subtitle styling, quality, etc.) means
 * adding one block to the root list and one panel — no architectural change.
 */
const RATE_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

type Panel = 'root' | 'speed' | 'language';

export interface SettingsMenuProps {
  open: boolean;
  onClose: () => void;
  /** Opens the keyboard-shortcut help overlay. */
  onShowShortcuts: () => void;
}

export default function SettingsMenu({ open, onClose, onShowShortcuts }: SettingsMenuProps) {
  const t = useTranslations('watch.player');
  const {
    state,
    actions,
    servers,
    currentServerIndex,
    onSwitchLanguage,
    autoPlayNext,
    setAutoPlayNext,
  } = usePlayer();
  const [panel, setPanel] = useState<Panel>('root');
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Only surface the keyboard-shortcuts entry where a physical keyboard is
  // likely (fine pointer = mouse/trackpad). Pointless on touch-only devices.
  const [hasKeyboard, setHasKeyboard] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    setHasKeyboard(window.matchMedia('(pointer: fine)').matches);
  }, []);

  // Reset to root when menu closes — better UX than persisting deep panel.
  useEffect(() => {
    if (!open) {
      const id = setTimeout(() => setPanel('root'), 250);
      return () => clearTimeout(id);
    }
  }, [open]);

  // Keyboard: ESC navigates back / closes.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (panel !== 'root') setPanel('root');
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, panel]);

  // Document-level pointerdown — closes the menu on clicks ANYWHERE outside
  // the panel (including outside the player itself). The in-player backdrop
  // handles clicks inside the player; this catches clicks on the page around
  // it. Listener is attached after the open state commits, so the gear-click
  // that opens the menu doesn't immediately close it.
  useEffect(() => {
    if (!open) return;
    const handler = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (rootRef.current && rootRef.current.contains(target)) return;
      onClose();
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [open, onClose]);

  const currentServer = servers[currentServerIndex];

  return (
    <div
      // pb-20 / lg:pb-24 lifts the panel above the bottom bar (progress + 1
      // row of controls ≈ 80–96px) so it doesn't overlap the gear / fullscreen
      // icons. Right padding keeps it aligned with the bottom-bar right edge.
      className={`pointer-events-none absolute inset-0 z-30 flex items-end justify-end p-4 pb-20 transition-opacity duration-200 lg:p-6 lg:pb-24 ${
        open ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden={!open}
    >
      {/* Backdrop — fades the rest, pointer-events live so click-outside dismisses. */}
      <div
        className={`absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-200 ${
          open ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        onPointerDown={onClose}
      />

      {/* Panel */}
      <div
        ref={rootRef}
        role="menu"
        aria-label="Settings"
        className={`relative w-72 overflow-hidden rounded-xl bg-black/85 text-ink-primary shadow-custom backdrop-blur-md transition-all duration-250 ease-out-expo ${
          open ? 'pointer-events-auto translate-y-0 scale-100' : 'pointer-events-none translate-y-4 scale-95'
        }`}
      >
        {/* Root panel */}
        <Panel active={panel === 'root'} direction="left">
          <Row
            label={t('settings.speed')}
            value={state.playbackRate === 1 ? t('settings.normal') : `${state.playbackRate}×`}
            onClick={() => setPanel('speed')}
            trailing={<ChevronRightIcon size={18} />}
          />
          {servers.length > 1 && (
            <Row
              label={t('settings.language')}
              value={currentServer?.name ?? ''}
              onClick={() => setPanel('language')}
              trailing={<ChevronRightIcon size={18} />}
            />
          )}
          <ToggleRow
            label={t('settings.autoPlayNext')}
            checked={autoPlayNext}
            onChange={setAutoPlayNext}
          />
          {hasKeyboard && (
            <Row
              label={t('shortcuts.title')}
              onClick={() => {
                onClose();
                onShowShortcuts();
              }}
              trailing={
                <kbd className="rounded border border-white/15 bg-surface-chip px-1.5 py-0.5 text-[11px] font-semibold leading-none text-ink-primary">
                  ?
                </kbd>
              }
            />
          )}
        </Panel>

        {/* Speed panel */}
        <Panel active={panel === 'speed'} direction="right">
          <BackHeader title={t('settings.speed')} onBack={() => setPanel('root')} />
          {RATE_OPTIONS.map((rate) => (
            <RadioRow
              key={rate}
              label={rate === 1 ? t('settings.normal') : `${rate}×`}
              selected={state.playbackRate === rate}
              onClick={() => {
                actions.setRate(rate);
                setPanel('root');
              }}
            />
          ))}
        </Panel>

        {/* Language panel */}
        <Panel active={panel === 'language'} direction="right">
          <BackHeader title={t('settings.language')} onBack={() => setPanel('root')} />
          {servers.map((srv, idx) => (
            <RadioRow
              key={`${srv.name}-${idx}`}
              label={srv.name}
              selected={idx === currentServerIndex}
              onClick={() => {
                onSwitchLanguage(idx);
                setPanel('root');
                onClose();
              }}
            />
          ))}
        </Panel>
      </div>
    </div>
  );
}

// ---- Building blocks ----

function Panel({
  active,
  direction,
  children,
}: {
  active: boolean;
  direction: 'left' | 'right';
  children: React.ReactNode;
}) {
  // Stacked panels use absolute positioning + slide-in. The active panel
  // dictates the menu's measured height via `relative`.
  return (
    <div
      className={`${
        active ? 'relative' : 'absolute inset-0'
      } transition-transform duration-200 ease-out-expo ${
        active ? 'translate-x-0' : direction === 'right' ? 'translate-x-full' : '-translate-x-full'
      } ${active ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <div className="py-1.5">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  onClick,
  trailing,
}: {
  label: string;
  value?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm outline-none transition-colors hover:bg-surface-chip focus-visible:bg-surface-chip"
    >
      <span className="font-medium text-ink-primary">{label}</span>
      <span className="flex items-center gap-2 text-ink-secondary">
        {value}
        {trailing}
      </span>
    </button>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm outline-none transition-colors hover:bg-surface-chip focus-visible:bg-surface-chip"
      aria-pressed={checked}
    >
      <span className="font-medium text-ink-primary">{label}</span>
      <span
        className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${
          checked ? 'bg-brand' : 'bg-white/25'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  );
}

function RadioRow({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm outline-none transition-colors hover:bg-surface-chip focus-visible:bg-surface-chip ${
        selected ? 'text-ink-primary' : 'text-ink-secondary'
      }`}
      role="menuitemradio"
      aria-checked={selected}
    >
      <span className="font-medium">{label}</span>
      {selected && <CheckIcon size={18} className="text-brand" />}
    </button>
  );
}

function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="flex w-full items-center gap-2 border-b border-white/10 px-3 py-2.5 text-left text-sm font-semibold text-ink-primary outline-none transition-colors hover:bg-surface-chip focus-visible:bg-surface-chip"
    >
      <ChevronLeftIcon size={18} />
      <span>{title}</span>
    </button>
  );
}
