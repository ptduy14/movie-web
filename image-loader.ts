'use client';

/**
 * Custom next/image loader — routes every image request through
 * app/api/image (sharp, self-hosted) instead of Vercel's metered Image
 * Optimization API. See docs/pagespeed-performance-audit.md (C1) for why.
 */
export default function movieImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const params = new URLSearchParams({
    url: src,
    w: width.toString(),
    q: (quality || 75).toString(),
  });
  return `/api/image?${params.toString()}`;
}
