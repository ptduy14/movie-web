'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from 'lib/firebase';
import MovieCollection from 'types/movie-collection';
import RegularMovieItem from '../commons/regular-movie-item';
import LoadingSpinner from '../loading/loading-spinner';
import BrandingPlaceholder from '../search/branding-placeholder';
import { A } from '../../redux/slices/progress-slice';
import firebaseServices from 'services/firebase-services';
import { IRecentMovie } from 'types/recent-movie';

export default function RecentMoviePage() {
  const [recentMovies, setRecentMovies] = useState<IRecentMovie[] | []>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const user = useSelector((state: any) => state.auth.user);
  const router = useRouter();

  const getRecentMovies = useCallback(async (userId: string) => {
    const movies = await firebaseServices.getRecentMovies(userId);
    setRecentMovies(movies);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    getRecentMovies(user.id);
  }, [user, router, getRecentMovies]);

  const renderRecentMovies = () => {
    if (recentMovies.length === 0)
      return (
        <div className="h-full w-full">
          <BrandingPlaceholder />
        </div>
      );

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 container-wrapper">
        {recentMovies.map((movie: MovieCollection, index) => (
          <RegularMovieItem movie={movie} key={index} />
        ))}
      </div>
    );
  };

  return (
    <div className="pt-16 md:pt-20 space-y-6 md:space-y-8 h-full px-4 md:px-0">
      <div>
        <div className="text-xl md:text-2xl font-bold text-center">Phim xem gần đây</div>
        <div className="text-sm md:text-base text-center mt-1 text-gray-300 px-4 md:px-0">
          MovieX giờ đã có tính năng lưu tiến trình tất cả phim mà bạn đã xem
        </div>
      </div>
      {isLoading ? <LoadingSpinner /> : renderRecentMovies()}
    </div>
  );
}
