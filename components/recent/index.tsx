'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    getRecentMovies(user.id);
  }, [user]);

  const getRecentMovies = async (userId: string) => {
    const movies = await firebaseServices.getRecentMovies(userId);
    setRecentMovies(movies);
    setIsLoading(false);
  };

  const renderRecentMovies = () => {
    if (recentMovies.length === 0)
      return (
        <div className="h-full w-full">
          <BrandingPlaceholder />
        </div>
      );

    return (
      <div className="grid grid-cols-5 gap-6 container-wrapper">
        {recentMovies.map((movie: MovieCollection, index) => (
          <RegularMovieItem movie={movie} key={index} />
        ))}
      </div>
    );
  };

  return (
    <div className="pt-20 space-y-8 h-full">
      <div>
        <div className="text-2xl font-bold flex justify-center">Phim xem gần đây</div>
        <div className="text-base flex justify-center mt-1 color-[#ffff]">
          MovieX giờ đã có tính năng lưu tiến trình tất cả phim mà bạn đã xem
        </div>
      </div>
      {isLoading ? <LoadingSpinner /> : renderRecentMovies()}
    </div>
  );
}
