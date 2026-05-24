'use client';

import { createContext, useContext } from 'react';
import type { PlayerActions, PlayerState } from 'hooks/usePlayerState';

/**
 * Local PlayerContext — scoped INSIDE <VideoPlayer>. Lives and dies with the
 * player instance. Not a global app context. Avoids prop-drilling through
 * ~8 sub-components without polluting the wider app state.
 */
export interface PlayerMeta {
  title: string;
  /** Human label for the current episode, e.g. "Ep 3". Empty for single-episode films. */
  episodeLabel?: string;
}

/**
 * OPhim-shaped server (= language variant). Passed in from the watch page so
 * the in-player Audio/Language menu can switch among them while preserving
 * `currentTime`.
 */
export interface PlayerServer {
  name: string;
  /** Episode count in this server. Used to clamp episodeIndex on switch. */
  episodeCount: number;
}

export interface NextEpisodePreview {
  /** 0-based index in the current server. */
  index: number;
  label: string;
  thumbnail: string;
}

export interface PlayerContextValue {
  state: PlayerState;
  actions: PlayerActions;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  meta: PlayerMeta;

  // ---- Phase 2: server / episode / preferences ----
  /** List of OPhim servers (Vietsub / Thuyết Minh / …) for the language menu. */
  servers: PlayerServer[];
  /** Currently active server index. */
  currentServerIndex: number;
  /** Switch language while preserving currentTime + clamping episodeIndex. */
  onSwitchLanguage: (newServerIndex: number) => void;
  /** Next episode preview (null when on the last episode). */
  nextEpisode: NextEpisodePreview | null;
  /** Triggered by NextEpisodeCard countdown end and by the N keyboard shortcut. */
  onNextEpisode: () => void;
  /** Persisted preference: auto-advance when an episode ends. */
  autoPlayNext: boolean;
  setAutoPlayNext: (v: boolean) => void;

  // ---- Phase 2: lock screen ----
  isLocked: boolean;
  setIsLocked: (v: boolean) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({
  value,
  children,
}: {
  value: PlayerContextValue;
  children: React.ReactNode;
}) {
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error('usePlayer() must be called inside <PlayerProvider>');
  }
  return ctx;
}
