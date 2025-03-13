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
import { db } from '../../configs/firebase'; // Đường dẫn đến tệp firebase của bạn
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
  const [isShowMessage, setIsShowMessage] = useState(false);
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

    if (!progress) return;
    
    let timerID: any;

    restoreGuestWatchProgress();
    

    // console.log(progress);
    // if (user) {
    //   // check if previous movie is current movie then use immediately this data
    //   if (progress.id === movie.movie._id) {
    //     setPreviousWatchProgress({
    //       progressEpIndex: progress.progress.episodeIndex,
    //       progressTime: progress.progress.progressTime,
    //       progressEpLink: progress.progress.episodeLink,
    //     });

    //     setIsShowMessage(true);

    //     // save movie watching progress to firestore
    //     (async () => {
    //       await handleAddRecentMovie(progress);
    //     })();

    //     return;
    //   } 
      
    //   // save movie watching progress to firestore
    //   (async () => {
    //     await handleAddRecentMovie(progress);
    //   })();
    //   console.log('ok');
    //   // get movie watching progress from firestore if exist
    //   (async () => {
    //     await handleGetRecentMovieProgress();
    //   })();

    //   return;
    // }

    // // this logic for user not login
    // setPreviousWatchProgress({
    //   progressEpIndex: progress.progress.episodeIndex,
    //   progressTime: progress.progress.progressTime,
    //   progressEpLink: progress.progress.episodeLink,
    // });

    // let timerID: any;

    // if (progress.id === movie.movie._id) {
    //   timerID = setTimeout(() => {
    //     setIsShowMessage(true);
    //   }, 2000);
    // }

    // return () => {
    //   if (timerID) clearTimeout(timerID);
    // };
  }, []);

  const restoreGuestWatchProgress = () => {
      if (progress.id !== movie.movie._id) return; 

      // for user not authenticated
      setPreviousWatchProgress({
        progressEpIndex: progress.progress.episodeIndex,
        progressTime: progress.progress.progressTime,
        progressEpLink: progress.progress.episodeLink,
      });
      setIsShowMessage(true);
  }

  const handleStoreTempViewProgress = async (e: any) => {
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
    window.addEventListener('beforeunload', handleStoreTempViewProgress);

    return () => {
      window.removeEventListener('beforeunload', handleStoreTempViewProgress);
    };
  }, [serverIndex, episodeLink, user]);
  
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
        quality: movie.movie.quality
      }

      await firebaseServices.storeRecentMovies(recentMovieData, user.id);
      setIsFirstPlay(false);
    }

    videoElement.addEventListener('playing', handleStoreRecentMovie);

    return () => {
      videoElement.removeEventListener('playing', handleStoreRecentMovie);
    }

  }, [isFirstPlay, user])

  const handleAcceptProgressWatch = () => {
    setEpisodeIndex(previousWatchProgress.progressEpIndex);
    setEpisodeLink(previousWatchProgress.progressEpLink);
    setVideoProgress(previousWatchProgress.progressTime);

    setIsShowMessage(false);
  };

  const handleRejectProgressWatch = () => {
    setIsShowMessage(false);
  };

  // const handleAddRecentMovie = async (progress: A) => {
  //   const recentMovie = {
  //     id: progress.id,
  //     slug: progress.slug,
  //     thumb_url: progress.thumb_url,
  //     name: progress.name,
  //     origin_name: progress.origin_name,
  //     lang: progress.lang,
  //     quality: progress.quality,
  //     progress: {
  //       progressTime: progress.progress.progressTime,
  //       episodeIndex: progress.progress.episodeIndex,
  //       episodeLink: progress.progress.episodeLink,
  //     },
  //   };

  //   try {
  //     //console.log("Attempting to store recent movie:", recentMovie);
  //     const userMoviesRef = doc(db, 'recentMovies', user.id);
  //     const docSnapshot = await getDoc(userMoviesRef);

  //     if (docSnapshot.exists()) {
  //       const recentMovies = docSnapshot.data()?.movies || [];
  //       const existingRecentMovieIndex = recentMovies.findIndex(
  //         (m: any) => m.id === recentMovie.id
  //       );

  //       if (existingRecentMovieIndex !== -1) {
  //         recentMovies[existingRecentMovieIndex] = recentMovie;

  //         await updateDoc(userMoviesRef, {
  //           movies: recentMovies,
  //         });
  //         console.log('Updated existing movie.');
  //       } else {
  //         await updateDoc(userMoviesRef, {
  //           movies: arrayUnion(recentMovie),
  //         });
  //         console.log('Added new movie.');
  //       }
  //     } else {
  //       await setDoc(userMoviesRef, {
  //         movies: [recentMovie],
  //       });
  //       console.log('Created new user movie collection.');
  //     }

  //     // remove stograge previous movie progress after store.
  //     // dispatch(removeProgress());
  //   } catch (error: any) {
  //     console.error('Error storing recent movie:', error.message);
  //   }
  // };

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
