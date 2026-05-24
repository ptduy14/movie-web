'use client';

import { usePlayer } from './player-context';

export default function TopBar() {
  const { meta } = usePlayer();
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent px-4 py-3 lg:px-6 lg:py-4">
      <div className="flex items-baseline gap-2 text-ink-primary">
        <h2 className="text-base font-semibold drop-shadow-sm lg:text-lg">{meta.title}</h2>
        {meta.episodeLabel && (
          <span className="text-sm text-ink-secondary lg:text-base">· {meta.episodeLabel}</span>
        )}
      </div>
    </div>
  );
}
