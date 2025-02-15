'use client';
import DetailMovie from 'types/detail-movie';
import VideoPlayer from './video-player';
import { useEffect, useState } from 'react';
import { isHaveEpisodesMovie } from 'utils/movie-utils';
import ServerSection from './server-section';
import { useRef } from 'react';
import ProgresswatchNotification from './progress-watch-notification';
import { useDispatch, useSelector } from 'react-redux';
import { setProgress } from '../../redux/slices/progress-slice';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../configs/firebase'; // Đường dẫn đến tệp firebase của bạn
import { A } from '../../redux/slices/progress-slice';
import CommentSection from '../comment';

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
    setEpisodeLink(movie.episodes[0].server_data[0].link_m3u8);
    setEpisodeIndex(0);

    if (!progress) return;

    // lưu lại tiến trình xem cuối cùng của phim trước vào db
    if (user && progress && progress.id !== movie.movie._id) {
      // Ensure it's awaited if async
      (async () => {
        await handleAddRecentMovie(progress);
      })();

      // lấy tiến trình xem phim cũ nếu có
      (async () => {
        await handleGetRecentMovieProgress();
      })();

      return;
    }

    setPreviousWatchProgress({
      progressEpIndex: progress.progress.episodeIndex,
      progressTime: progress.progress.progressTime,
      progressEpLink: progress.progress.episodeLink,
    });

    let timerID: any;

    if (progress.id === movie.movie._id) {
      timerID = setTimeout(() => {
        setIsShowMessage(true);
      }, 2000);
    }

    return () => {
      if (timerID) clearTimeout(timerID);
    };
  }, []);

  const handleStoreViewingProgress = async (e: any) => {
    if (videoRef.current?.currentTime === 0) return;

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
  };

  useEffect(() => {
    window.addEventListener('beforeunload', handleStoreViewingProgress);

    return () => {
      window.removeEventListener('beforeunload', handleStoreViewingProgress);
    };
  }, [episodeLink, user]);

  const handleAcceptProgressWatch = () => {
    setEpisodeIndex(previousWatchProgress.progressEpIndex);
    setEpisodeLink(previousWatchProgress.progressEpLink);
    setVideoProgress(previousWatchProgress.progressTime);

    setIsShowMessage(false);
  };

  const handleRejectProgressWatch = () => {
    setIsShowMessage(false);
  };

  const handleAddRecentMovie = async (progress: A) => {
    const recentMovie = {
      id: progress.id,
      slug: progress.slug,
      thumb_url: progress.thumb_url,
      name: progress.name,
      origin_name: progress.origin_name,
      lang: progress.lang,
      quality: progress.quality,
      progress: {
        progressTime: progress.progress.progressTime,
        episodeIndex: progress.progress.episodeIndex,
        episodeLink: progress.progress.episodeLink,
      },
    };

    try {
      //console.log("Attempting to store recent movie:", recentMovie);
      const userMoviesRef = doc(db, 'recentMovies', user.id);
      const docSnapshot = await getDoc(userMoviesRef);

      if (docSnapshot.exists()) {
        const recentMovies = docSnapshot.data()?.movies || [];
        const existingRecentMovieIndex = recentMovies.findIndex(
          (m: any) => m.id === recentMovie.id
        );

        if (existingRecentMovieIndex !== -1) {
          recentMovies[existingRecentMovieIndex] = recentMovie;

          await updateDoc(userMoviesRef, {
            movies: recentMovies,
          });
          console.log('Updated existing movie.');
        } else {
          await updateDoc(userMoviesRef, {
            movies: arrayUnion(recentMovie),
          });
          console.log('Added new movie.');
        }
      } else {
        await setDoc(userMoviesRef, {
          movies: [recentMovie],
        });
        console.log('Created new movie collection.');
      }
    } catch (error: any) {
      console.error('Error storing recent movie:', error.message);
    }
  };

  const handleGetRecentMovieProgress = async () => {
    try {
      const userMoviesRef = doc(db, 'recentMovies', user.id);
      const docSnapshot = await getDoc(userMoviesRef);

      if (docSnapshot.exists()) {
        const recentMovies = docSnapshot.data()?.movies || [];
        const recentMovie = recentMovies.find((m: any) => m.id === movie.movie._id);

        if (!recentMovie) return;

        console.log(recentMovie);

        setPreviousWatchProgress({
          progressEpIndex: recentMovie.progress.episodeIndex,
          progressTime: recentMovie.progress.progressTime,
          progressEpLink: recentMovie.progress.episodeLink,
        });

        setTimeout(() => {
          setIsShowMessage(true);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error fetching recent movie progress:', error.message);
    }
  };

  return (
    <div className="pt-[3.75rem] space-y-10">
      <ProgresswatchNotification
        isShowMessage={isShowMessage}
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
