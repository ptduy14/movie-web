/**
 * Skeleton placeholder for HeroSection.
 *
 * Mirrors the exact layout structure of `HeroMovieItem` (title, badges,
 * metadata, ratings, summary, buttons) so swapping skeleton → real content
 * causes no layout shift / CLS jump.
 *
 * - Desktop: bottom-left content block, w-2/4
 * - Mobile/Tablet: bottom gradient block, full width
 *
 * Uses `animate-pulse` on individual placeholder bars for a subtle shimmer.
 */
export default function HeroSectionSkeleton() {
  return (
    <div className="relative">
      <div className="container-wrapper relative w-full h-screen bg-neutral-900 overflow-hidden">
        {/* Match real hero gradient overlays so background tone is consistent */}
        <div className="absolute inset-0 bg-black opacity-45"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black to-50%"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black to-10%"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black to-10%"></div>
        <div className="absolute inset-0 bg-gradient-to-l from-black to-10%"></div>

        {/* Background shimmer on the poster area */}
        <div className="absolute inset-0 bg-neutral-800/40 animate-pulse"></div>

        {/* ===== Desktop layout ===== */}
        <div className="hidden lg:block absolute w-2/4 bottom-[5rem] left-6 space-y-5">
          {/* Badges row (Exclusive/NEW + Quality·Lang) */}
          <div className="flex items-center gap-2">
            <SkeletonBar w="w-24" h="h-5" />
            <SkeletonBar w="w-20" h="h-5" />
          </div>

          {/* Title (text-5xl ≈ h-12) */}
          <SkeletonBar w="w-3/4" h="h-12" />

          {/* Metadata row: year • categories • episode */}
          <div className="flex items-center gap-x-2">
            <SkeletonBar w="w-12" h="h-4" />
            <span className="w-1 h-1 rounded-full bg-neutral-700"></span>
            <SkeletonBar w="w-32" h="h-4" />
            <span className="w-1 h-1 rounded-full bg-neutral-700"></span>
            <SkeletonBar w="w-16" h="h-4" />
          </div>

          {/* Ratings row (TMDB + IMDb) */}
          <div className="flex items-center gap-x-4">
            <SkeletonBar w="w-44" h="h-10" rounded="rounded-md" />
            <SkeletonBar w="w-44" h="h-10" rounded="rounded-md" />
          </div>

          {/* Summary (3 lines, decreasing width) */}
          <div className="space-y-2">
            <SkeletonBar w="w-full" h="h-4" />
            <SkeletonBar w="w-full" h="h-4" />
            <SkeletonBar w="w-5/6" h="h-4" />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-5 pt-1">
            <SkeletonBar w="w-32" h="h-12" rounded="rounded-md" />
            <SkeletonBar w="w-44" h="h-12" rounded="rounded-md" />
          </div>
        </div>

        {/* ===== Mobile/Tablet layout ===== */}
        <div className="lg:hidden absolute inset-0 flex flex-col justify-end">
          <div className="bg-gradient-to-t from-black via-black/80 to-transparent p-4 pb-8 space-y-3">
            {/* Badges */}
            <div className="flex items-center gap-2">
              <SkeletonBar w="w-20" h="h-5" />
              <SkeletonBar w="w-16" h="h-5" />
            </div>

            {/* Title */}
            <SkeletonBar w="w-3/4" h="h-7" />

            {/* Metadata inline */}
            <div className="flex items-center gap-x-3 flex-wrap">
              <SkeletonBar w="w-10" h="h-3" />
              <SkeletonBar w="w-16" h="h-3" />
              <SkeletonBar w="w-14" h="h-3" />
              <SkeletonBar w="w-12" h="h-3" />
            </div>

            {/* Buttons */}
            <div className="space-y-3 pt-2">
              <SkeletonBar w="w-full" h="h-12" rounded="rounded-lg" />
              <SkeletonBar w="w-full" h="h-12" rounded="rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SkeletonBarProps {
  w: string;
  h: string;
  rounded?: string;
}

function SkeletonBar({ w, h, rounded = 'rounded' }: SkeletonBarProps) {
  return <div className={`${w} ${h} ${rounded} bg-neutral-700/60 animate-pulse`}></div>;
}
