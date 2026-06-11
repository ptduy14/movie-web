'use client';

import { useEffect, useRef, useState } from 'react';
import { usePlayerState } from 'hooks/usePlayerState';
import { useAutoHideControls } from 'hooks/useAutoHideControls';
import { useKeyboardShortcuts } from 'hooks/useKeyboardShortcuts';
import { usePlayerPersistence } from 'hooks/usePlayerPersistence';
import { useMobileGestures } from 'hooks/useMobileGestures';
import {
  PlayerProvider,
  type NextEpisodePreview,
  type PlayerMeta,
  type PlayerServer,
} from './player-context';
import TopBar from './top-bar';
import CenterControls from './center-controls';
import BottomBar from './bottom-bar';
import BufferingSpinner from './buffering-spinner';
import SettingsMenu from './settings-menu';
import NextEpisodeCard from './next-episode-card';
import LockScreen from './lock-screen';
import KeyboardHint from './keyboard-hint';
import { formatTime } from './progress-bar';

const DOUBLE_TAP_MS = 280;
const SEEK_FEEDBACK_MS = 600;

export interface VideoControlsOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  meta: PlayerMeta;

  // Phase 2 — server/episode controls
  servers: PlayerServer[];
  currentServerIndex: number;
  onSwitchLanguage: (newServerIndex: number) => void;
  nextEpisode: NextEpisodePreview | null;
  onNextEpisode: () => void;

  /** When true (initial state before stream is ready), overlay sits dormant. */
  disabled?: boolean;
}

/**
 * Custom controls overlay. Renders absolute over the <video> element. Owns the
 * player state, keyboard shortcuts, auto-hide, tap/double-tap gestures,
 * settings menu, next-episode card, mobile gestures, and lock screen.
 *
 * IMPORTANT: this component MUST NOT replace, wrap, or proxy the <video>
 * element. `useVideoProgress` and `useWatchAnalytics` listen directly on the
 * `videoRef` and rely on the element identity being stable.
 */
export default function VideoControlsOverlay({
  videoRef,
  containerRef,
  meta,
  servers,
  currentServerIndex,
  onSwitchLanguage,
  nextEpisode,
  onNextEpisode,
  disabled = false,
}: VideoControlsOverlayProps) {
  const { state, actions } = usePlayerState(videoRef);
  const { autoPlayNext, setAutoPlayNext, preferredServerName, setPreferredServerName } =
    usePlayerPersistence(videoRef);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const { visible, bindContainer } = useAutoHideControls({
    isPlaying: state.isPlaying,
    isBuffering: state.isBuffering,
    isEnded: state.isEnded,
    forceVisible: settingsOpen || helpOpen,
  });

  useKeyboardShortcuts({
    containerRef,
    state,
    actions,
    onNextEpisode,
    onToggleHelp: () => setHelpOpen((v) => !v),
  });

  const { brightness, hud } = useMobileGestures({
    containerRef,
    state,
    actions,
    enabled: !disabled && !isLocked,
  });

  // Apply gesture-driven brightness to the <video> via CSS filter. Real device
  // brightness is not web-accessible — this is a visual approximation.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.style.filter = brightness === 1 ? '' : `brightness(${brightness})`;
  }, [brightness, videoRef]);

  // Honor preferred-server-name once on mount: if it matches a server name and
  // differs from current, switch automatically. Saves the user from manually
  // re-selecting "Thuyết Minh" every visit.
  const preferredAppliedRef = useRef(false);
  useEffect(() => {
    if (preferredAppliedRef.current) return;
    if (!preferredServerName) return;
    if (servers.length <= 1) return;
    const target = servers.findIndex((s) => s.name === preferredServerName);
    if (target >= 0 && target !== currentServerIndex) {
      onSwitchLanguage(target);
    }
    preferredAppliedRef.current = true;
  }, [preferredServerName, servers, currentServerIndex, onSwitchLanguage]);

  // Save preferred server when user explicitly switches via the in-player menu.
  const handleSwitchLanguage = (index: number) => {
    const target = servers[index];
    if (target) setPreferredServerName(target.name);
    onSwitchLanguage(index);
  };

  // Tap/double-tap state for the click-through layer.
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const [seekFlash, setSeekFlash] = useState<'left' | 'right' | null>(null);

  // Hide the native cursor only during ACTIVE idle playback (overlay enabled
  // + controls auto-hidden). When the overlay is disabled (pre-play poster
  // phase between episode switches), the user needs the cursor to find the
  // Play button. Cleanup resets the cursor on unmount so it never gets stuck
  // on `none`.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.style.cursor = disabled || visible ? '' : 'none';
    return () => {
      if (container) container.style.cursor = '';
    };
  }, [visible, disabled, containerRef]);

  if (disabled) return null;

  /**
   * Desktop UX: single click → instant toggle play/pause; double-click → enter
   * fullscreen. To avoid a 280ms delay on every single click (waiting to see
   * if a second click arrives), we toggle on EVERY click. On a real
   * double-click, the second click toggles again — net-zero play state — and
   * then we fire fullscreen. Result: zero perceived delay on single clicks;
   * brief play→pause→play flicker on double-clicks (same pattern as YouTube).
   *
   * Mobile UX: single tap reveals controls (via auto-hide's touchstart
   * binding); double-tap → ±10s seek with ripple. No "tap to toggle" on
   * mobile because users would accidentally pause when trying to dismiss
   * controls.
   */
  const handleTapSurface = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isLocked) return;
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
      lastTapRef.current = null;
      if (e.pointerType === 'touch') {
        // Mobile: zone-based seek (first tap did nothing — nothing to undo).
        const isLeft = x - rect.left < rect.width / 2;
        actions.seekBy(isLeft ? -10 : 10);
        setSeekFlash(isLeft ? 'left' : 'right');
        setTimeout(() => setSeekFlash(null), SEEK_FEEDBACK_MS);
      } else {
        // Desktop: enter fullscreen. The first click already toggled play/
        // pause — undo it here so net play state is preserved.
        actions.toggle();
        actions.toggleFullscreen(containerRef.current);
      }
      return;
    }

    lastTapRef.current = { time: now, x, y };
    if (e.pointerType !== 'touch') {
      // Instant desktop toggle. No delay.
      actions.toggle();
    }
  };

  const contextValue = {
    state,
    actions,
    videoRef,
    containerRef,
    meta,
    servers,
    currentServerIndex,
    onSwitchLanguage: handleSwitchLanguage,
    nextEpisode,
    onNextEpisode,
    autoPlayNext,
    setAutoPlayNext,
    isLocked,
    setIsLocked,
  };

  return (
    <PlayerProvider value={contextValue}>
      <div
        className="absolute inset-0 z-10"
        onPointerDown={handleTapSurface}
        {...bindContainer}
      >
        {/* Mobile gesture HUD */}
        {hud && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-lg bg-black/70 px-4 py-2 text-sm font-semibold text-ink-primary backdrop-blur-sm">
              {hud.kind === 'scrub' && (
                <>
                  <span className="tabular-nums">{formatTime(hud.targetTime)}</span>
                  <span className="ml-2 text-ink-secondary tabular-nums">
                    {hud.delta >= 0 ? '+' : '−'}
                    {Math.abs(Math.round(hud.delta))}s
                  </span>
                </>
              )}
              {hud.kind === 'volume' && (
                <span>Volume {Math.round(hud.value * 100)}%</span>
              )}
              {hud.kind === 'brightness' && (
                <span>Brightness {Math.round(hud.value * 100)}%</span>
              )}
            </div>
          </div>
        )}

        {/* Double-tap seek-ripple */}
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

        {/* Controls chrome. `pointer-events-none` on the wrapper lets clicks on
            the empty middle area (and on the top/bottom gradient backgrounds)
            pass through to the tap surface for click-anywhere-to-toggle. The
            actual buttons inside set `pointer-events-auto` to stay clickable. */}
        <div
          className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out-expo ${
            visible && !isLocked ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <TopBar />
          {/* Center controls hidden during buffering so the spinner has the
              stage to itself (and not behind the play button). */}
          {!state.isBuffering && (!state.isPlaying || visible) && <CenterControls />}
          <BottomBar onOpenSettings={() => setSettingsOpen(true)} />
        </div>

        {/* Buffering spinner rendered AFTER the chrome so it sits on top in
            source order. Pointer-events-none keeps it from blocking taps. */}
        <BufferingSpinner />

        <NextEpisodeCard />
        <SettingsMenu
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onShowShortcuts={() => setHelpOpen(true)}
        />
        <KeyboardHint open={helpOpen} onClose={() => setHelpOpen(false)} />
        <LockScreen />
      </div>
    </PlayerProvider>
  );
}
