import Hls from 'hls.js';
import type {
  LoaderCallbacks,
  LoaderConfiguration,
  LoaderContext,
  PlaylistLoaderConstructor,
  PlaylistLoaderContext,
} from 'hls.js';

/**
 * Strip the video ad the catalog splices into its HLS playlists.
 *
 * Probed 2026-10-16 on 12 films: 10 carried the same 30-second block about
 * fifteen minutes in, fenced by `#EXT-X-DISCONTINUITY` and made of
 * absolute-path segments — `/v8/d61a03b1…/segment_0001.ts` — while the film
 * itself uses short relative names (`c487a8Hh.ts`). The block is identical
 * across titles, which is what an ad looks like and what film footage never
 * does.
 *
 * Matching is by SHAPE, not by the hash: `/v<digits>/<long hex>/segment_<n>.ts`
 * as an absolute path. A new creative gets a new hash; the shape is what the
 * ad server writes. If the shape ever changes this filter simply removes
 * nothing, and the ad plays — annoying, never broken.
 *
 * Each removed block is replaced by a single `#EXT-X-DISCONTINUITY`, so the
 * film segments on either side are still told the timeline may jump.
 */

const AD_SEGMENT = /^\/v\d+\/[0-9a-f]{16,}\/segment_\d+\.ts(\?.*)?$/i;

export interface AdFilterResult {
  playlist: string;
  /** Ad segments dropped. */
  removedSegments: number;
  /** Seconds of ad dropped. */
  removedSeconds: number;
}

/**
 * Remove ad segments from a media playlist. A master playlist, or a media
 * playlist with no ad, comes back unchanged.
 */
export function stripPlaylistAds(playlist: string): AdFilterResult {
  if (!playlist.includes('#EXTINF')) {
    return { playlist, removedSegments: 0, removedSeconds: 0 };
  }

  const lines = playlist.split(/\r?\n/);
  const out: string[] = [];
  let pending: string[] = []; // tags waiting for the URI they describe
  let removedSegments = 0;
  let removedSeconds = 0;
  let lastWasDiscontinuity = false;

  const push = (line: string) => {
    if (line === '#EXT-X-DISCONTINUITY') {
      // Collapse the double tags left behind where a block was cut.
      if (lastWasDiscontinuity) return;
      lastWasDiscontinuity = true;
    } else if (line.trim() !== '' && !line.startsWith('#EXT-X-KEY')) {
      // A KEY tag between two discontinuities (the ad block re-declares
      // METHOD=NONE) doesn't separate them.
      lastWasDiscontinuity = false;
    }
    out.push(line);
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#EXTINF') || (pending.length > 0 && trimmed.startsWith('#') && trimmed !== '#EXT-X-DISCONTINUITY')) {
      // Per-segment tags (EXTINF, BYTERANGE, KEY…) belong to the next URI.
      pending.push(line);
      continue;
    }
    if (trimmed && !trimmed.startsWith('#') && pending.length > 0) {
      if (AD_SEGMENT.test(trimmed)) {
        removedSegments += 1;
        const extinf = pending.find((l) => l.startsWith('#EXTINF'));
        const seconds = extinf ? parseFloat(extinf.slice(8)) : 0;
        if (Number.isFinite(seconds)) removedSeconds += seconds;
      } else {
        pending.forEach(push);
        push(line);
      }
      pending = [];
      continue;
    }
    pending.forEach(push);
    pending = [];
    push(line);
  }
  pending.forEach(push);

  return { playlist: out.join('\n'), removedSegments, removedSeconds };
}

type OnAdsRemoved = (result: Omit<AdFilterResult, 'playlist'>) => void;

/**
 * An hls.js playlist loader that runs every media playlist through
 * `stripPlaylistAds` before hls.js parses it.
 *
 * Pass the result as `pLoader` in the Hls config. `onAdsRemoved` fires once
 * per playlist that actually had something removed.
 */
export function createAdFilteringPlaylistLoader(onAdsRemoved?: OnAdsRemoved): PlaylistLoaderConstructor {
  const Base = Hls.DefaultConfig.loader;

  class AdFilteringPlaylistLoader extends Base {
    load(
      context: LoaderContext,
      config: LoaderConfiguration,
      callbacks: LoaderCallbacks<LoaderContext>
    ) {
      const onSuccess = callbacks.onSuccess;
      const type = (context as PlaylistLoaderContext).type;
      if (type === 'manifest' || type === 'level') {
        callbacks.onSuccess = (response, stats, ctx, networkDetails) => {
          if (typeof response.data === 'string') {
            const result = stripPlaylistAds(response.data);
            if (result.removedSegments > 0) {
              response.data = result.playlist;
              onAdsRemoved?.({
                removedSegments: result.removedSegments,
                removedSeconds: result.removedSeconds,
              });
            }
          }
          onSuccess(response, stats, ctx, networkDetails);
        };
      }
      super.load(context, config, callbacks);
    }
  }

  // hls.js types its playlist loader against the narrower playlist context;
  // the default loader it extends handles every context, so this is safe.
  return AdFilteringPlaylistLoader as unknown as PlaylistLoaderConstructor;
}
