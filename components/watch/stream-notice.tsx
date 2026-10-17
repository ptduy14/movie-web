'use client';

import { useTranslations } from 'next-intl';
import { IoRefresh, IoSwapHorizontal, IoWarningOutline, IoInformationCircleOutline } from 'react-icons/io5';
import type { StreamReason } from 'hooks/useStreamReachability';

/**
 * What the viewer sees when the main catalog stream can't load, or when
 * the backup source is playing instead.
 *
 * Two variants:
 *  - `blocked` fills the player box: the main stream failed and nothing is
 *    playing. Says why (WARP / VPN / CDN) and offers Try again plus, when the
 *    title has one, the backup source.
 *  - `fallback` is a slim bar under the player: the backup source IS
 *    playing, and the viewer should know it has no voiceover/dub and how to
 *    get back.
 */
export default function StreamNotice({
  variant,
  reason,
  isRetrying,
  onRetry,
  onUseFallback,
  onUseMain,
}: {
  variant: 'blocked' | 'fallback';
  reason: StreamReason | null;
  isRetrying?: boolean;
  onRetry: () => void;
  /** Null when the title has no backup source. */
  onUseFallback: (() => void) | null;
  onUseMain?: () => void;
}) {
  const t = useTranslations('watch.stream');
  const key = reason ?? 'unknown';

  if (variant === 'fallback') {
    return (
      <div className="container-wrapper-movie px-4 lg:px-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
          <IoInformationCircleOutline size={18} className="shrink-0 text-brand" />
          <span className="min-w-0 flex-1">
            {reason === 'abroad' ? t('fallback.abroad') : t('fallback.chosen')}
          </span>
          {onUseMain && (
            <button
              type="button"
              onClick={onUseMain}
              className="shrink-0 font-semibold text-white underline-offset-4 hover:underline"
            >
              {t('useMain')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black">
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <IoWarningOutline size={36} className="mx-auto text-brand" />
          <h2 className="mt-3 text-lg font-semibold text-white lg:text-xl">{t(`${key}.title`)}</h2>
          <p className="mt-2 text-sm text-gray-300 lg:text-base">{t(`${key}.body`)}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              className="flex min-h-[44px] items-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-black transition-colors hover:bg-[#d3d3d3] disabled:opacity-60"
            >
              <IoRefresh size={18} className={isRetrying ? 'animate-spin' : ''} />
              {t('retry')}
            </button>
            {onUseFallback ? (
              <button
                type="button"
                onClick={onUseFallback}
                className="flex min-h-[44px] items-center gap-2 rounded-md border border-white/30 px-4 text-sm font-semibold text-white transition-colors hover:border-white"
              >
                <IoSwapHorizontal size={18} />
                {t('useFallback')}
              </button>
            ) : (
              <span className="text-xs text-gray-400">{t('noFallback')}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
