'use client';

import DetailMovie from 'types/detail-movie';
import VideoPlayer from './video-player';
import { useEffect, useMemo, useState } from 'react';
import { isHaveEpisodesMovie } from 'utils/movie-utils';
import { useRef } from 'react';
import ProgresswatchNotification from './progress-watch-notification';
import { useVideoProgress } from 'hooks/useVideoProgress';
import { useWatchAnalytics } from 'hooks/useWatchAnalytics';
import { analytics } from 'lib/posthog/events';
import CommentSection from '../comment';
import { useTranslations } from 'next-intl';
import type {
  NextEpisodePreview,
  PlayerServer,
} from './video-controls/player-context';

export default function MovieWatchPage({ movie }: { movie: DetailMovie }) {
  const t = useTranslations('watch');
  const [serverIndex, setServerIndex] = useState<number>(0);
  const [episodeIndex, setEpisodeIndex] = useState<number>(0);
  const [episodeLink, setEpisodeLink] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const {
    restoredProgress,
    isShowResumePrompt,
    handleAcceptResume,
    handleRejectResume,
    setVideoProgress,
    videoProgress,
  } = useVideoProgress({
    movie,
    videoRef,
    episodeIndex,
    episodeLink,
    serverIndex,
    setEpisodeIndex,
    setEpisodeLink,
    setServerIndex,
  });

  useWatchAnalytics({
    movieId: movie.movie._id,
    episodeIndex,
    serverIndex,
    videoRef,
  });

  const handleSwitchEpisode = (index: number) => {
    if (index === episodeIndex) return;
    analytics.episodeSwitched(movie.movie._id, episodeIndex, index);
    setEpisodeIndex(index);
    setEpisodeLink(movie.episodes[serverIndex].server_data[index].link_m3u8);
    setVideoProgress(null);
  };

  /**
   * Language (= OPhim server) switch from the in-player menu. Preserves the
   * current playback time and clamps the episode index against the new
   * server's episode count. Drives the existing `videoProgress` resume
   * mechanism so the player seeks to the same time after HLS reloads.
   */
  const handleSwitchLanguage = (newServerIndex: number) => {
    if (newServerIndex === serverIndex) return;
    const newServer = movie.episodes[newServerIndex];
    if (!newServer?.server_data?.length) return;

    const preservedTime = videoRef.current?.currentTime ?? 0;
    const clampedEp = Math.min(episodeIndex, newServer.server_data.length - 1);

    analytics.serverSwitched(movie.movie._id, serverIndex, newServerIndex);
    setServerIndex(newServerIndex);
    setEpisodeIndex(clampedEp);
    setEpisodeLink(newServer.server_data[clampedEp].link_m3u8);
    // Only resume if the user was past the very beginning — avoids a jarring
    // seek when they switch language right after pressing play.
    setVideoProgress(preservedTime > 3 ? preservedTime : null);
  };

  const handleNextEpisode = () => {
    const list = movie.episodes[serverIndex]?.server_data ?? [];
    const next = episodeIndex + 1;
    if (next >= list.length) return;
    handleSwitchEpisode(next);
  };

  useEffect(() => {
    setEpisodeLink(movie.episodes[0].server_data[0].link_m3u8);
    setEpisodeIndex(0);
  }, [movie.movie._id, movie.episodes]);

  // ---- Derived props for VideoPlayer ----
  const servers: PlayerServer[] = useMemo(
    () =>
      movie.episodes.map((srv) => ({
        name: srv.server_name,
        episodeCount: srv.server_data.length,
      })),
    [movie.episodes]
  );

  const nextEpisode: NextEpisodePreview | null = useMemo(() => {
    const list = movie.episodes[serverIndex]?.server_data ?? [];
    const nextIdx = episodeIndex + 1;
    if (nextIdx >= list.length) return null;
    return {
      index: nextIdx,
      label: isHaveEpisodesMovie(movie)
        ? t('episodeLabel', { index: nextIdx + 1 })
        : list[nextIdx].name,
      thumbnail: movie.movie.thumb_url || movie.movie.poster_url,
    };
  }, [movie, serverIndex, episodeIndex, t]);

  return (
    <div className="pt-20 lg:pt-[3.75rem] space-y-6 lg:space-y-10">
      <ProgresswatchNotification
        isShowResumePrompt={isShowResumePrompt}
        restoredProgress={restoredProgress}
        handleAcceptResume={handleAcceptResume}
        handleRejectResume={handleRejectResume}
        movie={movie}
      />
      <VideoPlayer
        ref={videoRef}
        videoUrl={episodeLink}
        thumbnail={movie.movie.poster_url}
        videoProgress={videoProgress}
        meta={{
          title: movie.movie.name,
          episodeLabel: isHaveEpisodesMovie(movie)
            ? t('episodeLabel', { index: episodeIndex + 1 })
            : undefined,
        }}
        servers={servers}
        currentServerIndex={serverIndex}
        onSwitchLanguage={handleSwitchLanguage}
        nextEpisode={nextEpisode}
        onNextEpisode={handleNextEpisode}
      />
      <div className="container-wrapper-movie px-4 lg:px-0">
        <h1 className="text-xl lg:text-3xl">{movie.movie.name}</h1>
        <h3 className="text-base lg:text-lg text-[#bbb6ae] mt-2">{movie.movie.origin_name}</h3>
      </div>
      {isHaveEpisodesMovie(movie) && (
        <div className="container-wrapper-movie px-4 lg:px-0">
          <h1 className="text-lg lg:text-xl">{t('episodeList')}</h1>
          <ul className="flex flex-wrap gap-2 lg:gap-3 mt-4">
            {movie.episodes[0].server_data.map((ep, index) => (
              <li
                key={index}
                className={`block ${
                  episodeIndex === index
                    ? 'text-white bg-[#5E5E5E]'
                    : 'bg-white text-black hover:bg-[#d3d3d3]'
                } px-2 lg:px-3 py-1.5 lg:py-2 rounded-md font-semibold cursor-pointer text-sm lg:text-base`}
                onClick={() => handleSwitchEpisode(index)}
              >
                {t('episodeLabel', { index: index + 1 })}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="container-wrapper-movie px-4 lg:px-0">
        <CommentSection movie={movie} />
      </div>
    </div>
  );
}
