'use client';
import { useTranslations } from 'next-intl';
import DetailMovie from 'types/detail-movie';
import convertSecondToTime from 'utils/convert-second-to-time';
import type { RestoredProgress } from 'hooks/useVideoProgress';

export default function ProgresswatchNotification({
  isShowResumePrompt,
  restoredProgress,
  handleAcceptResume,
  handleRejectResume,
  movie,
}: {
  isShowResumePrompt: boolean;
  restoredProgress: RestoredProgress;
  handleAcceptResume: () => void;
  handleRejectResume: () => void;
  movie: DetailMovie;
}) {
  const t = useTranslations('watch.progressNotification');
  const { position, episodeIndex } = restoredProgress;

  const renderCurrentEpisode = () => {
    if (movie.episodes[0].server_data.length === 1) return;
    return <span className="font-bold">{t('episodePrefix', { index: episodeIndex + 1 })}</span>;
  };

  return (
    <div
      className={`fixed top-16 ${
        isShowResumePrompt ? 'right-8' : 'right-[-30rem]'
      } bg-white z-20 text-black w-96 px-4 py-2 transition-all duration-500 space-y-4`}
    >
      <span>
        {t('message')} {renderCurrentEpisode()}{' '}
        <span className="font-bold">{convertSecondToTime(position)}</span>, {t('question')}
      </span>
      <div className="flex items-center justify-center space-x-10">
        <button onClick={handleAcceptResume} className="px-6 py-2 bg-black text-white">
          {t('accept')}
        </button>
        <button onClick={handleRejectResume} className="px-6 py-2 bg-[#5e5e5e] text-white">
          {t('reject')}
        </button>
      </div>
    </div>
  );
}
