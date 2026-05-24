'use client';

import { usePlayer } from './player-context';

export default function BufferingSpinner() {
  const { state } = usePlayer();
  if (!state.isBuffering) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <svg
        className="animate-spin text-ink-primary"
        width={56}
        height={56}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>
  );
}
