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
import firebaseServices from 'services/firebase-services';

export default function MovieCollectionPage() {
  const [movieCollection, setMovieCollection] = useState<MovieCollection[] | []>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const user = useSelector((state: any) => state.auth.user);
  const router = useRouter();

  const getMovieCollection = useCallback(async () => {
    const movies = await firebaseServices.getMovieCollection(user.id);
    setMovieCollection(movies);
    setIsLoading(false);
  }, [user.id]);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    getMovieCollection();
  }, [user, router, getMovieCollection]);

  const renderMovieCollection = () => {
    if (movieCollection.length === 0)
      return (
        <div className="h-full w-full">
          <BrandingPlaceholder />
        </div>
      );

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 container-wrapper">
        {movieCollection.map((movie: MovieCollection, index) => (
          <RegularMovieItem movie={movie} key={index} />
        ))}
      </div>
    );
  };

  return (
    <div className="pt-16 md:pt-20 space-y-6 md:space-y-8 h-full px-4 md:px-0">
      <div className="text-xl md:text-2xl font-bold text-center">Bộ sưu tập phim của bạn</div>
      {isLoading ? <LoadingSpinner /> : renderMovieCollection()}
    </div>
  );
}
