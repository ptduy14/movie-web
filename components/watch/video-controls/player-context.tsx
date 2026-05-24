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

export interface PlayerContextValue {
  state: PlayerState;
  actions: PlayerActions;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  meta: PlayerMeta;
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
