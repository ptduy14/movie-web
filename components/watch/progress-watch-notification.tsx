'use client';
import { useTranslations } from 'next-intl';
import convertSecondToTime from 'utils/convert-second-to-time';

/**
 * Resume prompt. Rendered INSIDE the player surface (top-center) rather than as
 * a fixed banner above the page — see §7 (Tier B) of
 * docs/custom-video-controls.md. Styled to match the player overlay's dark,
 * red-accent theme. Slides down from the top edge of the player when shown.
 *
 * It lives above the pre-play poster (z-30) so it stays visible during the
 * poster phase, before the user has pressed play.
 */
export default function ProgresswatchNotification({
  show,
  position,
  episodeIndex,
  isMultiEpisode,
  onAccept,
  onReject,
}: {
  show: boolean;
  position: number;
  episodeIndex: number;
  isMultiEpisode: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const t = useTranslations('watch.progressNotification');

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center px-3 pt-3 transition-all duration-500 ease-out-expo lg:pt-4 ${
        show ? 'translate-y-0 opacity-100' : '-translate-y-6 opacity-0'
      }`}
      aria-hidden={!show}
    >
      <div
        className={`flex max-w-[calc(100%-1.5rem)] flex-col gap-2.5 rounded-xl bg-black/85 px-4 py-3 text-ink-primary shadow-custom ring-1 ring-white/10 backdrop-blur-md sm:flex-row sm:items-center sm:gap-4 ${
          show ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <span className="text-xs leading-relaxed lg:text-sm">
          {t('message')}{' '}
          {isMultiEpisode && (
            <span className="font-bold">{t('episodePrefix', { index: episodeIndex + 1 })} </span>
          )}
          <span className="font-bold text-brand">{convertSecondToTime(position)}</span>,{' '}
          {t('question')}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onAccept}
            className="rounded-md bg-brand px-3.5 py-1.5 text-xs font-semibold text-white outline-none transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-white lg:text-sm"
          >
            {t('accept')}
          </button>
          <button
            type="button"
            onClick={onReject}
            className="rounded-md bg-surface-chip px-3.5 py-1.5 text-xs font-semibold text-ink-primary outline-none transition-colors hover:bg-surface-chipHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-white lg:text-sm"
          >
            {t('reject')}
          </button>
        </div>
      </div>
    </div>
  );
}
