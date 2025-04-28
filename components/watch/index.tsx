'use client';
import DetailMovie from 'types/detail-movie';
import VideoPlayer from './video-player';
import { useEffect, useState } from 'react';
import { isHaveEpisodesMovie } from 'utils/movie-utils';
import ServerSection from './server-section';
import { useRef } from 'react';
import ProgresswatchNotification from './progress-watch-notification';
import { useDispatch, useSelector } from 'react-redux';
import { removeProgress, setProgress } from '../../redux/slices/progress-slice';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../lib/firebase'; // Đường dẫn đến tệp firebase của bạn
import { A } from '../../redux/slices/progress-slice';
import CommentSection from '../comment';
import { IoMdReturnLeft } from 'react-icons/io';
import { IRecentMovie } from 'types/recent-movie';
import firebaseServices from 'services/firebase-services';

export default function MovieWatchPage({ movie }: { movie: DetailMovie }) {
  // episodes[serverIndex]: server được chọn
  // server_data[episodeIndex] || server_data[index]: tập phim

  const user = useSelector((state: any) => state.auth.user);
  const progress = useSelector((state: any) => state.progress.progress);
  const dispatch = useDispatch();

  const [serverIndex, setServerIndex] = useState<number>(0);
  const [episodeIndex, setEpisodeIndex] = useState<number>(0);
  const [episodeLink, setEpisodeLink] = useState<string>('');
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [previousWatchProgress, setPreviousWatchProgress] = useState({
    progressTime: 0,
    progressEpIndex: 0,
    progressEpLink: '',
  });
  const [isShowToastProgress, setIsShowToastProgress] = useState(false);
  const [isFirstPlay, setIsFirstPlay] = useState<boolean>(true);

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
    setEpisodeLink(movie.episodes[0].server_data[0].link_m3u8);
    setEpisodeIndex(0);

    // restore progress watching of user authenticated
    if (user) {
      restoreUserWatchProgress(user.id, movie.movie._id);
    }

    restoreGuestWatchProgress(progress);
  }, []);

  const restoreUserWatchProgress = async (userId: string, movieId: string) => {
    const res: any = await firebaseServices.getProgressWatchOfMovie(userId, movieId);

    if (!res.status) {
      return;
    }

    setPreviousWatchProgress({
      progressEpIndex: res.progressEpIndex,
      progressTime: res.progressTime,
      progressEpLink: res.progressEpLink,
    });
    
    setTimeout(() => {
      setIsShowToastProgress(true);
    }, 2000)
  }

  const restoreGuestWatchProgress = (progress: any) => {
    if (progress?.id !== movie.movie._id) return;

    setPreviousWatchProgress({
      progressEpIndex: progress.progress.episodeIndex,
      progressTime: progress.progress.progressTime,
      progressEpLink: progress.progress.episodeLink,
    });

    setTimeout(() => {
      setIsShowToastProgress(true);
    }, 2000)
  };

  const handleTrackingProgressWatch = async (e: any) => {
    if (videoRef.current?.currentTime === 0) return;

    // store data for user not authenticated
    if (!user) {
      const progress = {
        id: movie.movie._id,
        slug: movie.movie.slug,
        thumb_url: movie.movie.thumb_url,
        name: movie.movie.name,
        origin_name: movie.movie.origin_name,
        lang: movie.movie.lang,
        quality: movie.movie.quality,
        progress: {
          progressTime: videoRef.current?.currentTime,
          episodeIndex,
          episodeLink,
        },
      };

      dispatch(setProgress(progress));
      return;
    }

    // store data for user authenticated
    const recentMovieData: IRecentMovie = {
      userId: user.id,
      id: movie.movie._id,
      slug: movie.movie.slug,
      thumb_url: movie.movie.thumb_url,
      name: movie.movie.name,
      origin_name: movie.movie.origin_name,
      lang: movie.movie.lang,
      quality: movie.movie.quality,
      progressEpIndex: episodeIndex || 0,
      progressTime:  videoRef.current?.currentTime || 0,
      progressEpLink: episodeLink || movie.episodes[0].server_data[0].link_m3u8,
    };

    // Convert the data into a JSON string
    const jsonData = JSON.stringify(recentMovieData);

    // Create a Blob with the correct MIME type
    const blob = new Blob([jsonData], { type: 'application/json' });

    // this route will handle store recent movie and progress of movie
    navigator.sendBeacon('/api/movies/store-recent-movie', blob);
  };

  useEffect(() => {
    window.addEventListener('beforeunload', handleTrackingProgressWatch);

    return () => {
      window.removeEventListener('beforeunload', handleTrackingProgressWatch);
    };
  }, [episodeLink, user]);

  useEffect(() => {
    if (!videoRef.current || !isFirstPlay || !user) return;

    const videoElement = videoRef.current;

    const handleStoreRecentMovie = async () => {
      const recentMovieData: IRecentMovie = {
        id: movie.movie._id,
        slug: movie.movie.slug,
        thumb_url: movie.movie.thumb_url,
        name: movie.movie.name,
        origin_name: movie.movie.origin_name,
        lang: movie.movie.lang,
        quality: movie.movie.quality,
        progressEpIndex: progress.progress.episodeIndex || 0,
        progressTime: progress.progress.progressTime || 0,
        progressEpLink: progress.progress.episodeLink || movie.episodes[0].server_data[0].link_m3u8,
      };

      await firebaseServices.storeRecentMovies(recentMovieData, user.id);
      setIsFirstPlay(false);
    };

    videoElement.addEventListener('playing', handleStoreRecentMovie);

    return () => {
      videoElement.removeEventListener('playing', handleStoreRecentMovie);
    };
  }, [isFirstPlay, user]);

  const handleAcceptProgressWatch = () => {
    setEpisodeIndex(previousWatchProgress.progressEpIndex);
    setEpisodeLink(previousWatchProgress.progressEpLink);
    setVideoProgress(previousWatchProgress.progressTime);

    setIsShowToastProgress(false);
  };

  const handleRejectProgressWatch = () => {
    setIsShowToastProgress(false);
  };

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
