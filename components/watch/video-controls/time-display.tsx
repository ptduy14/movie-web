'use client';

import { useState } from 'react';
import { usePlayer } from './player-context';
import { formatTime } from './progress-bar';

export default function TimeDisplay() {
  const { state } = usePlayer();
  const [showRemaining, setShowRemaining] = useState(false);

  const cur = state.currentTime;
  const dur = state.duration;
  const remaining = Math.max(0, dur - cur);

  const display = showRemaining ? `-${formatTime(remaining)}` : formatTime(cur);

  return (
    <button
      type="button"
      onClick={() => setShowRemaining((v) => !v)}
      title="Toggle remaining / elapsed"
      className="select-none text-sm font-medium tabular-nums text-ink-primary outline-none transition-opacity hover:opacity-80 focus-visible:opacity-80"
    >
      <span>{display}</span>
      <span className="mx-1 text-ink-secondary">/</span>
      <span className="text-ink-secondary">{formatTime(dur)}</span>
    </button>
  );
}
