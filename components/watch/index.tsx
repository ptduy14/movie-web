'use client';
import DetailMovie from 'types/detail-movie';
import VideoPlayer from './video-player';
import { useEffect, useState } from 'react';
import { isHaveEpisodesMovie } from 'utils/movie-utils';
import ServerSection from './server-section';
import { useRef } from 'react';
import ProgresswatchNotification from './progress-watch-notification';

export default function MovieWatchPage({ movie }: { movie: DetailMovie }) {
  // episodes[serverIndex]: server được chọn
  // server_data[episodeIndex] || server_data[index]: tập phim

  const [serverIndex, setServerIndex] = useState<number>(0);
  const [episodeIndex, setEpisodeIndex] = useState<number>(0);
  const [episodeLink, setEpisodeLink] = useState<string>('');
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [progressWatchInfo, setProgressWatchInfo] = useState({
    progressTime: 0,
    progressEpIndex: 0,
    progressEpLink: '',
  });

  const [isShowMessage, setIsShowMessage] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleSwitchEpisode = (index: number) => {
    setEpisodeIndex(index);
    setEpisodeLink(movie.episodes[serverIndex].server_data[index].link_m3u8);
    setVideoProgress(null);
  };

  const handleSetServerIndex = (index: number) => {
    if (index === serverIndex) return;

    setServerIndex(index);
    setEpisodeLink(movie.episodes[serverIndex].server_data[0].link_m3u8);
    setEpisodeIndex(0);
  };

  useEffect(() => {
    // const progressJSON = localStorage.getItem('progress' || '');
    // if (!progressJSON) {
    //   setEpisodeLink(movie.episodes[0].server_data[0].link_m3u8);
    //   setEpisodeIndex(0);
    //   return;
    // }

    // const progress = JSON.parse(progressJSON);
    // if (typeof progress !== 'object' || progress.id !== movie.movie._id || progress.progressTime === 0) {
    //   setEpisodeLink(movie.episodes[0].server_data[0].link_m3u8);
    //   setEpisodeIndex(0);
    //   return;
    // }
    // setEpisodeIndex(progress.episodeIndex);
    // setEpisodeLink(progress.episodeLink);
    // setVideoProgress(progress.progressTime);

    setEpisodeLink(movie.episodes[0].server_data[0].link_m3u8);
    setEpisodeIndex(0);

    const progressJSON = localStorage.getItem('progress' || '');
    if (!progressJSON) return;

    const progress = JSON.parse(progressJSON);
    if (
      typeof progress !== 'object' ||
      progress.id !== movie.movie._id ||
      progress.progressTime === 0
    )
      return;

    setProgressWatchInfo({
      progressEpIndex: progress.episodeIndex,
      progressTime: progress.progressTime,
      progressEpLink: progress.episodeLink,
    });

    let timerID = setTimeout(() => {
      setIsShowMessage(true);
    }, 2000);

    return () => {
      if (timerID) clearTimeout(timerID);
    };
  }, []);

  const handleStoreViewingProgress = (e: any) => {
    const progress = {
      id: movie.movie._id,
      progressTime: videoRef.current?.currentTime,
      episodeIndex,
      episodeLink,
    };

    localStorage.setItem('progress', JSON.stringify(progress));
  };

  useEffect(() => {
    window.addEventListener('beforeunload', handleStoreViewingProgress);

    return () => {
      window.removeEventListener('beforeunload', handleStoreViewingProgress);
    };
  }, [episodeLink]);

  const handleAcceptProgressWatch = () => {
    setEpisodeIndex(progressWatchInfo.progressEpIndex);
    setEpisodeLink(progressWatchInfo.progressEpLink);
    setVideoProgress(progressWatchInfo.progressTime);

    setIsShowMessage(false);

    // videoRef.current?.addEventListener('canplaythrough', (e) => {
    //   videoRef.current?.play();
    // })
  };

  const handleRejectProgressWatch = () => {
    setIsShowMessage(false);
  };

  return (
    <div className="pt-[3.75rem] space-y-10">
      <ProgresswatchNotification
        isShowMessage={isShowMessage}
        progressWatchInfo={progressWatchInfo}
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
        <div className="flex items-center">
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
    </div>
  );
}
