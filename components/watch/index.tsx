'use client';

import DetailMovie from 'types/detail-movie';
import VideoPlayer from './video-player';
import { useEffect, useState } from 'react';
import { isHaveEpisodesMovie } from 'utils/movie-utils';
import ServerSection from './server-section';
import { useRef } from 'react';
import ProgresswatchNotification from './progress-watch-notification';
import { useWatchProgress } from 'hooks/useWatchProgress';
import CommentSection from '../comment';

export default function MovieWatchPage({ movie }: { movie: DetailMovie }) {
  const [serverIndex, setServerIndex] = useState<number>(0);
  const [episodeIndex, setEpisodeIndex] = useState<number>(0);
  const [episodeLink, setEpisodeLink] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const {
    previousWatchProgress,
    isShowToastProgress,
    handleAcceptProgressWatch,
    handleRejectProgressWatch,
    setVideoProgress,
    videoProgress,
  } = useWatchProgress({
    movie,
    videoRef,
    episodeIndex,
    episodeLink,
    serverIndex,
    setEpisodeIndex,
    setEpisodeLink,
    setServerIndex,
  });

  const handleSwitchEpisode = (index: number) => {
    setEpisodeIndex(index);
    setEpisodeLink(movie.episodes[serverIndex].server_data[index].link_m3u8);
    setVideoProgress(null);
  };

  const handleSetServerIndex = (index: number) => {
    if (index === serverIndex) return;

    setServerIndex(index);
    setEpisodeLink(movie.episodes[index].server_data[0].link_m3u8);
    setEpisodeIndex(0);
    setVideoProgress(null);
  };

  useEffect(() => {
    setEpisodeLink(movie.episodes[0].server_data[0].link_m3u8);
    setEpisodeIndex(0);
  }, [movie.movie._id, movie.episodes]);

  return (
    <div className="pt-[3.75rem] space-y-10">
      <ProgresswatchNotification
        isShowMessage={isShowToastProgress}
        previousWatchProgress={previousWatchProgress}
        handleAcceptProgressWatch={handleAcceptProgressWatch}
        handleRejectProgressWatch={handleRejectProgressWatch}
        movie={movie}
      />
      <VideoPlayer
        ref={videoRef}
        videoUrl={episodeLink}
        thumbnail={movie.movie.poster_url}
        videoProgress={videoProgress}
      />
      {movie.episodes.length > 1 && (
        <div className="text-center">
          Nếu xem phim bị giật lag vui lòng chọn một trong các server bên dưới
        </div>
      )}
      <ServerSection
        movie={movie}
        serverIndex={serverIndex}
        handleSetServerIndex={handleSetServerIndex}
      />
      <div className="container-wrapper-movie">
        <h1 className="text-3xl">{movie.movie.name}</h1>
        <h3 className="text-lg text-[#bbb6ae] mt-2">{movie.movie.origin_name}</h3>
      </div>
      {isHaveEpisodesMovie(movie) && (
        <div className="container-wrapper-movie">
          <h1 className="text-xl">Danh sách tập phim</h1>
          <ul className="flex flex-wrap gap-3 mt-4">
            {movie.episodes[0].server_data.map((ep, index) => (
              <li
                key={index}
                className={`block ${
                  episodeIndex === index
                    ? 'text-white bg-[#5E5E5E]'
                    : 'bg-white text-black hover:bg-[#d3d3d3]'
                } px-3 py-2 rounded-md font-semibold cursor-pointer`}
                onClick={() => handleSwitchEpisode(index)}
              >
                {`Tập ${index + 1}`}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="container-wrapper-movie">
        <CommentSection movie={movie} />
      </div>
    </div>
  );
}
