interface MovieGridSkeletonProps {
  /** Number of placeholder cards. Defaults to 20 (4 rows × 5 cols on desktop). */
  count?: number;
}

/**
 * Skeleton for a paginated movie grid (format / type / country pages).
 * Mirrors the live grid layout `grid-cols-2 sm:3 md:4 lg:5` so the swap to
 * real content does not shift layout.
 */
export default function MovieGridSkeleton({ count = 20 }: MovieGridSkeletonProps) {
  return (
    <div className="pt-[3.75rem]">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6 container-wrapper px-4 sm:px-6 md:px-8 lg:px-0">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Compact 1-row skeleton used while loading the next page during infinite scroll.
 */
export function MovieGridLoadMoreSkeleton({ count = 5 }: MovieGridSkeletonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6 container-wrapper px-4 sm:px-6 md:px-8 lg:px-0 pt-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="space-y-2">
      <div className="relative w-full aspect-[2/3] bg-neutral-700/60 rounded animate-pulse"></div>
      <div className="h-4 w-full bg-neutral-700/60 rounded animate-pulse"></div>
      <div className="h-3 w-3/4 bg-neutral-700/40 rounded animate-pulse"></div>
    </div>
  );
}
