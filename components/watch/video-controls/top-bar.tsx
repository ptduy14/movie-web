'use client';

import { usePlayer } from './player-context';
import { LockToggleButton } from './lock-screen';

export default function TopBar() {
  const { meta } = usePlayer();
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent px-3 py-2 lg:px-6 lg:py-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-baseline gap-1.5 text-ink-primary lg:gap-2">
          <h2 className="line-clamp-1 text-sm font-semibold drop-shadow-sm lg:text-lg">
            {meta.title}
          </h2>
          {meta.episodeLabel && (
            <span className="shrink-0 text-xs text-ink-secondary lg:text-base">
              · {meta.episodeLabel}
            </span>
          )}
        </div>
        <LockToggleButton />
      </div>
    </div>
  );
}
