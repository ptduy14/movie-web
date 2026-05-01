import { MdMovie } from 'react-icons/md';
import { MovieGridLoadMoreSkeleton } from './movie-grid-skeleton';

interface InfiniteScrollSentinelProps {
  /** Attach this ref to a `<div>` that becomes visible when user scrolls near the bottom. */
  sentinelRef: (node?: Element | null) => void;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  onRetry: () => void;
  isEmpty: boolean;
}

/**
 * Visual sentinel + status messaging for infinite-scroll pagination.
 * Renders different UI for: loading more / end of list / error / empty.
 */
export default function InfiniteScrollSentinel({
  sentinelRef,
  isLoadingMore,
  hasMore,
  error,
  onRetry,
  isEmpty,
}: InfiniteScrollSentinelProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <div className="text-red-400 text-sm">❌ Đã có lỗi khi tải phim</div>
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded bg-white text-black text-sm font-semibold hover:bg-neutral-200 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!hasMore) {
    if (isEmpty) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-white/60">
          <MdMovie className="text-4xl" />
          <div className="text-sm">Chưa có phim nào trong danh mục này</div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center py-10 text-white/60 text-sm">
        🎬 Bạn đã xem hết danh sách
      </div>
    );
  }

  return (
    <>
      {isLoadingMore && <MovieGridLoadMoreSkeleton count={5} />}
      {/* Sentinel — invisible div the IntersectionObserver watches */}
      <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
    </>
  );
}
