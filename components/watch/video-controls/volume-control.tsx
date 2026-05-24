'use client';

import { useState } from 'react';
import { usePlayer } from './player-context';
import { VolumeHighIcon, VolumeLowIcon, VolumeMutedIcon } from './icons';

export default function VolumeControl() {
  const { state, actions } = usePlayer();
  const [hover, setHover] = useState(false);
  const showSlider = hover; // hover-popout on desktop; touch users tap to mute

  const effectiveVolume = state.muted ? 0 : state.volume;
  const Icon = state.muted || state.volume === 0
    ? VolumeMutedIcon
    : state.volume < 0.5
      ? VolumeLowIcon
      : VolumeHighIcon;

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        type="button"
        onClick={actions.toggleMute}
        aria-label={state.muted ? 'Unmute' : 'Mute'}
        className="rounded p-2 text-ink-primary outline-none transition-colors duration-150 hover:bg-surface-chip focus-visible:bg-surface-chip"
      >
        <Icon size={22} />
      </button>
      <div
        className={`flex items-center overflow-hidden transition-[width,opacity] duration-200 ease-out-expo ${
          showSlider ? 'w-20 opacity-100' : 'w-0 opacity-0'
        }`}
      >
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={effectiveVolume}
          onChange={(e) => actions.setVolume(parseFloat(e.target.value))}
          aria-label="Volume"
          className="volume-slider mx-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-brand"
          style={{
            background: `linear-gradient(to right, #e10711 0%, #e10711 ${
              effectiveVolume * 100
            }%, rgba(255,255,255,0.2) ${effectiveVolume * 100}%, rgba(255,255,255,0.2) 100%)`,
          }}
        />
      </div>
    </div>
  );
}
