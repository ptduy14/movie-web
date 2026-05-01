/**
 * Skeleton for a horizontal MovieList row.
 *
 * Mirrors the Swiper layout (responsive slidesPerView 2/3/4/5) using a
 * flex row with overflow clipping, so card positions match exactly when
 * real content loads. Each card placeholder mimics NewlyMovieItem /
 * RegularMovieItem structure: aspect-[2/3] poster + 2 text bars.
 */
export default function MovieListSkeleton() {
  return (
    <div className="container-wrapper space-y-4">
      {/* Title bar — matches `text-xl md:text-2xl font-semibold` */}
      <div className="px-4 md:px-0">
        <div className="h-6 md:h-7 w-48 bg-neutral-700/60 rounded animate-pulse"></div>
      </div>

      {/* Card row — overflow-hidden clips cards beyond the viewport,
          mimicking Swiper's behavior at each breakpoint */}
      <div className="overflow-hidden px-4 md:px-0">
        <div className="flex gap-4 sm:gap-5 md:gap-6 lg:gap-[30px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Placeholder for a single movie card.
 * Width breakpoints match Swiper's `slidesPerView` config in MovieList:
 * 2 → 3 → 4 → 5 across mobile / sm / md / lg.
 */
function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.83rem)] md:w-[calc(25%-1.125rem)] lg:w-[calc(20%-1.5rem)] space-y-2">
      {/* Poster (aspect-[2/3]) */}
      <div className="relative w-full aspect-[2/3] bg-neutral-700/60 rounded animate-pulse"></div>
      {/* Title line */}
      <div className="h-4 w-full bg-neutral-700/60 rounded animate-pulse"></div>
      {/* Origin name line (smaller, narrower) */}
      <div className="h-3 w-3/4 bg-neutral-700/40 rounded animate-pulse"></div>
    </div>
  );
}
