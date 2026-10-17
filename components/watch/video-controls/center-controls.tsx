'use client';

import { usePlayer } from './player-context';
import { PlayIcon, PauseIcon, Skip10BackIcon, Skip10ForwardIcon } from './icons';

/**
 * Center stack: ⟲10s · ▶ · 10s⟳. The big play/pause is always rendered so the
 * user has a clear, large tap target — Apple TV-style. On mobile, skip buttons
 * are kept the same size to maintain finger-friendly hit areas.
 */
export default function CenterControls() {
  const { state, actions } = usePlayer();
  const Icon = state.isPlaying ? PauseIcon : PlayIcon;

  // Sizing scales up at `lg:` for desktop. On small mobile players (~211px
  // tall in portrait) the previous fixed sizes felt overpowering.
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-4 lg:gap-16">
      <button
        type="button"
        onClick={() => actions.seekBy(-10)}
        aria-label="Back 10 seconds"
        className="pointer-events-auto rounded-full bg-black/30 p-2 text-ink-primary backdrop-blur-sm transition-all duration-200 ease-out-expo hover:scale-110 hover:bg-black/50 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand lg:p-3"
      >
        <Skip10BackIcon className="h-6 w-6 lg:h-8 lg:w-8" />
      </button>
      <button
        type="button"
        onClick={actions.toggle}
        aria-label={state.isPlaying ? 'Pause' : 'Play'}
        className="pointer-events-auto rounded-full bg-black/40 p-3 text-ink-primary backdrop-blur-sm transition-all duration-200 ease-out-expo hover:scale-110 hover:bg-black/60 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand lg:p-5"
      >
        <Icon className="h-7 w-7 lg:h-10 lg:w-10" />
      </button>
      <button
        type="button"
        onClick={() => actions.seekBy(10)}
        aria-label="Forward 10 seconds"
        className="pointer-events-auto rounded-full bg-black/30 p-2 text-ink-primary backdrop-blur-sm transition-all duration-200 ease-out-expo hover:scale-110 hover:bg-black/50 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand lg:p-3"
      >
        <Skip10ForwardIcon className="h-6 w-6 lg:h-8 lg:w-8" />
      </button>
    </div>
  );
}
