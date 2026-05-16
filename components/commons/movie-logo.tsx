'use client';

import { useEffect, useState } from 'react';

/**
 * Pixel block we sample to compute average luminance. The TMDB w500 logos
 * are at most ~500px wide; a 64×64 downscale is plenty for "is this mostly
 * dark?" — we're answering a yes/no question, not building a histogram.
 */
const SAMPLE_SIZE = 64;

/**
 * Average luminance (ITU-R BT.601, 0-255 scale) below which the logo is
 * considered too dark to read on the hero background and gets force-inverted
 * to white. Pure-black title cards score ~5-20, mid-grey ~120, white ~240.
 */
const DARK_THRESHOLD = 80;

/**
 * Minimum alpha (0-255) for a pixel to be counted in the luminance average.
 * Below this is logo background — counting it would pull every transparent-
 * background logo toward "dark" and incorrectly invert white-text logos.
 */
const ALPHA_THRESHOLD = 64;

type DetectionState = 'detecting' | 'normal' | 'invert';

interface MovieLogoProps {
  src: string;
  alt: string;
  /**
   * Sizing / shadow / positioning utilities applied to the `<img>`. Brightness
   * filters added by this component compose with any `drop-shadow-[...]`
   * Tailwind class via Tailwind 3's CSS-variable filter pipeline — no override.
   */
  className?: string;
}

/**
 * Renders a TMDB title-card logo with automatic dark-logo correction.
 *
 * Some TMDB community uploads ship black-on-transparent logos (designed for
 * light marketing pages) which vanish against our dark hero. After load we
 * sample average luminance via a hidden canvas and, if the logo is mostly
 * dark, apply `brightness(0) invert(1)` to force it white. Light/colored
 * logos render unmodified.
 *
 * CORS: `image.tmdb.org` sends `Access-Control-Allow-Origin: *`, so the
 * canvas readback is not tainted. On any unexpected failure (CORS change,
 * SecurityError, etc.) we degrade to the un-inverted render — the same
 * behavior as before this component existed, so we never break worse than
 * the baseline.
 *
 * To avoid a visible flash of a dark-then-inverted logo, the image starts at
 * `opacity-0` and fades in only after detection resolves.
 */
export default function MovieLogo({ src, alt, className }: MovieLogoProps) {
  const [state, setState] = useState<DetectionState>('detecting');

  // Detection runs in a parallel JS `Image` rather than on the rendered <img>
  // for two reasons:
  //  1. Browser cache: when the rendered <img> hits a cached resource, its
  //     `onLoad` may not fire — a long-standing quirk that left logos stuck
  //     at opacity-0 forever.
  //  2. Re-renders / src swaps (Swiper hero slides): a parallel Image scoped
  //     to a `useEffect` cleanly resets per src, so we never reuse a stale
  //     "invert" state from a previous slide.
  // The two requests dedupe via the browser HTTP cache, so this isn't a
  // double-fetch in practice.
  useEffect(() => {
    setState('detecting');
    let cancelled = false;

    const probe = new Image();
    probe.crossOrigin = 'anonymous';

    probe.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setState('normal');
          return;
        }
        ctx.drawImage(probe, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

        let lumSum = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < ALPHA_THRESHOLD) continue;
          lumSum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          count++;
        }
        // Fully transparent image → nothing to base a decision on; render as-is.
        if (count === 0) {
          setState('normal');
          return;
        }
        setState(lumSum / count < DARK_THRESHOLD ? 'invert' : 'normal');
      } catch {
        setState('normal');
      }
    };

    // Image fetch / decode failure — show the rendered <img> as-is (it will
    // hit the same failure, but at least we're not stuck at opacity-0).
    probe.onerror = () => {
      if (cancelled) return;
      setState('normal');
    };

    probe.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  const filterClass = state === 'invert' ? 'brightness-0 invert' : '';
  const opacityClass = state === 'detecting' ? 'opacity-0' : 'opacity-100';

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`transition-opacity duration-200 ${opacityClass} ${filterClass} ${className ?? ''}`}
    />
  );
}
