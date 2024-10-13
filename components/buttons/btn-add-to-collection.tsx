'use client';

import { FaPlus } from 'react-icons/fa';
import { TiTick } from 'react-icons/ti';
import { useSelector } from 'react-redux';
import { useAuthModel } from '../context/auth-modal-context';
import DetailMovie from 'types/detail-movie';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../configs/firebase'; // Đường dẫn đến tệp firebase của bạn
import { toast } from 'react-toastify';
import { useEffect, useState, useCallback } from 'react';
import LoadingSpinerBtn from '../loading/loading-spiner-btn';

interface BtnAddToCollectionProps {
  variant: 'primary' | 'secondary'; // Prop để điều chỉnh kiểu dáng
  detailMovie: DetailMovie;
}

export default function BtnAddToCollection({ variant, detailMovie }: BtnAddToCollectionProps) {
  const user = useSelector((state: any) => state.account.user);
  const { openAuthModal } = useAuthModel();
  const [isHandling, setIsHandling] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExistedInCollection, setIsExistedInCollection] = useState<boolean>(false);

  // const addMovieToUserCollection = useCallback(async () => {
  //   if (!user) {
  //     openAuthModal();
  //     return;
  //   }

  //   setIsHandling(true);

  //   const movie = {
  //     id: detailMovie.movie._id,
  //     slug: detailMovie.movie.slug,
  //     thumb_url: detailMovie.movie.thumb_url,
  //     origin_name: detailMovie.movie.origin_name,
  //     lang: detailMovie.movie.lang,
  //     quality: detailMovie.movie.quality,
  //   };

  //   try {
  //     await handleAddMovieToUserCollection(user.uid, movie);
  //     toast.success('Phim đã được thêm vào bộ sưu tập');
  //     setIsExistedInCollection(true);
  //   } catch (error: any) {
  //     console.log(error.message);
  //   } finally {
  //     setIsHandling(false);
  //   }
  // }, [user, detailMovie]);

  // const handleAddMovieToUserCollection = async (userId: string, movie: any) => {
  //   const userMoviesRef = doc(db, 'userMovies', userId);

  //   const docSnapshot = await getDoc(userMoviesRef);

  //   if (docSnapshot.exists()) {
  //     // Nếu đã tồn tại, cập nhật mảng movies
  //     await updateDoc(userMoviesRef, {
  //       movies: arrayUnion(movie), // Thêm movie vào mảng hiện có
  //     });
  //   } else {
  //     // Nếu chưa tồn tại, tạo document mới
  //     await setDoc(userMoviesRef, {
  //       movies: [movie], // Tạo mảng mới với movie đầu tiên
  //     });
  //   }
  // };

  // useEffect(() => {
  //   if (!user || isExistedInCollection) return; // Chỉ kiểm tra nếu chưa tồn tại

  //   const getCheckMovieIsExistedInCollection = async () => {
  //     const userMoviesRef = doc(db, 'userMovies', user.uid);
  //     const docSnapshot = await getDoc(userMoviesRef);

  //     if (docSnapshot.exists()) {
  //       const existingMovies = docSnapshot.data().movies;
  //       const movieExists = existingMovies.some((m: any) => m.id === detailMovie.movie._id);

  //       if (movieExists) {
  //         setIsExistedInCollection(true);
  //       }
  //     }
  //   };

  //   getCheckMovieIsExistedInCollection();
  // }, [user, detailMovie]);

  // useEffect(() => {
  //   setIsLoading(false);
  //   if (!user) {
  //     setIsExistedInCollection(false);
  //   }
  //   setIsLoading(false);
  // }, [user]);

  const addMovieToUserCollection = async () => {
    if (!user) {
      openAuthModal();
      return;
    }

    setIsHandling(true);

    const movie = {
      id: detailMovie.movie._id,
      slug: detailMovie.movie.slug,
      thumb_url: detailMovie.movie.thumb_url,
      origin_name: detailMovie.movie.origin_name,
      lang: detailMovie.movie.lang,
      quality: detailMovie.movie.quality,
    };

    try {
      const userMoviesRef = doc(db, 'userMovies', user.id);
      const docSnapshot = await getDoc(userMoviesRef);

      if (docSnapshot.exists()) {
        await updateDoc(userMoviesRef, {
          movies: arrayUnion(movie),
        });
      } else {
        await setDoc(userMoviesRef, {
          movies: [movie],
        });
      }

      toast.success('Phim đã được thêm vào bộ sưu tập');
      setIsExistedInCollection(true);
    } catch (error: any) {
      console.log(error.message);
    } finally {
      setIsHandling(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setIsExistedInCollection(false);
      setIsLoading(false);
      return;
    }

    const checkIfMovieExists = async () => {
      const userMoviesRef = doc(db, 'userMovies', user.id);
      const docSnapshot = await getDoc(userMoviesRef);

      if (docSnapshot.exists()) {
        const existingMovies = docSnapshot.data().movies || [];
        const movieExists = existingMovies.some((m: any) => m.id === detailMovie.movie._id);
        setIsExistedInCollection(movieExists);
      }
      setIsLoading(false);
    };

    checkIfMovieExists();
  }, [user, detailMovie.movie._id]);

  return (
    <button
      className={
        variant === 'primary'
          ? 'flex items-center space-x-2 bg-[#717171] py-3 px-5 rounded-md text-white transition duration-200 ease-in-out hover:bg-[#5a5a5a]' // Thay đổi màu nền khi hover
          : 'flex items-center bg-white px-3 py-2 rounded-md gap-x-2 text-black font-semibold transition duration-200 ease-in-out hover:bg-gray-200' // Thay đổi màu nền khi hover
      }
      onClick={addMovieToUserCollection}
      disabled={isHandling || isExistedInCollection || isLoading}
    >
      {isLoading || isHandling ? (
        <LoadingSpinerBtn />
      ) : (
        <>
          {isExistedInCollection ? <TiTick size={18} /> : <FaPlus size={18} />}
          <span className="block leading-4 font-semibold">Bộ sưu tập</span>
        </>
      )}
    </button>
  );
}
