'use client';

import { useEffect, useState } from 'react';
import { usePlayer } from './player-context';
import ProgressBar from './progress-bar';
import VolumeControl from './volume-control';
import TimeDisplay from './time-display';
import {
  PlayIcon,
  PauseIcon,
  FullscreenEnterIcon,
  FullscreenExitIcon,
  SettingsIcon,
  PipIcon,
} from './icons';

export interface BottomBarProps {
  onOpenSettings: () => void;
}

export default function BottomBar({ onOpenSettings }: BottomBarProps) {
  const { state, actions, containerRef, videoRef } = usePlayer();
  const PlayPauseIcon = state.isPlaying ? PauseIcon : PlayIcon;
  const FsIcon = state.isFullscreen ? FullscreenExitIcon : FullscreenEnterIcon;
  const [pipSupported, setPipSupported] = useState(false);

  // PiP capability is browser-dependent — iOS Safari (<14) doesn't expose it
  // on document, mobile Chrome partially supports. Detect once on mount.
  useEffect(() => {
    setPipSupported(
      typeof document !== 'undefined' &&
        (document as any).pictureInPictureEnabled === true
    );
  }, []);

  const togglePip = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await (video as any).requestPictureInPicture?.();
      }
    } catch {
      // user gesture required / denied — silently ignore.
    }
  };

  // Gradient height + icon sizes scale up at `lg:` so the bar isn't dominant
  // on small mobile players.
  const iconClass = 'h-5 w-5 lg:h-[22px] lg:w-[22px]';
  const btnClass =
    'rounded p-1.5 text-ink-primary outline-none transition-colors duration-150 hover:bg-surface-chip focus-visible:bg-surface-chip lg:p-2';

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pb-1 pt-6 lg:px-6 lg:pb-3 lg:pt-12">
      <div className="pointer-events-auto">
        <ProgressBar />
        <div className="flex items-center justify-between gap-1 pt-0.5 lg:gap-2 lg:pt-1">
          <div className="flex items-center gap-0.5 lg:gap-1">
            <button
              type="button"
              onClick={actions.toggle}
              aria-label={state.isPlaying ? 'Pause' : 'Play'}
              className={btnClass}
            >
              <PlayPauseIcon className={iconClass} />
            </button>
            <VolumeControl />
            <div className="ml-2 hidden lg:block">
              <TimeDisplay />
            </div>
          </div>
          <div className="flex items-center gap-0.5 lg:gap-1">
            <div className="block lg:hidden">
              <TimeDisplay />
            </div>
            {pipSupported && (
              <button
                type="button"
                onClick={togglePip}
                aria-label="Picture in Picture"
                className={btnClass}
              >
                <PipIcon className={iconClass} />
              </button>
            )}
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Settings"
              className={btnClass}
            >
              <SettingsIcon className={iconClass} />
            </button>
            <button
              type="button"
              onClick={() => actions.toggleFullscreen(containerRef.current)}
              aria-label={state.isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className={btnClass}
            >
              <FsIcon className={iconClass} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
