'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from 'configs/firebase';
import MovieCollection from 'types/movie-collection';
import RegularMovieItem from '../commons/regular-movie-item';
import LoadingComponent from '../loading/loading-component';
import BrandingPlaceholder from '../search/branding-placeholder';

export default function MovieCollectionPage() {
  const [movieCollection, setMovieCollection] = useState<MovieCollection[] | []>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const user = useSelector((state: any) => state.account.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/');
    }

    getMovieCollection();
  }, [user]);

  const getMovieCollection = async () => {
    if (!user) return;

    const userMovieRef = doc(db, 'userMovies', user.id);
    const docSnapshot = await getDoc(userMovieRef);

    if (docSnapshot.exists()) {
      const movies = docSnapshot.data().movies || [];
      setMovieCollection(movies);
    }

    setIsLoading(false);
  };

  const renderMovieCollection = () => {
    if (movieCollection.length === 0) return <div className='h-full w-full'><BrandingPlaceholder/></div>;

    return (
      <div className="grid grid-cols-5 gap-6 container-wrapper">
        {movieCollection.map((movie: MovieCollection, index) => (
          <RegularMovieItem movie={movie} key={index} />
        ))}
      </div>
    );
  };

  return (
    <div className="pt-20 space-y-8 h-full">
      <div className="text-2xl font-bold flex justify-center">Bộ sưu tập phim của bạn</div>
      {isLoading ? <LoadingComponent /> : renderMovieCollection()}
    </div>
  );
}
