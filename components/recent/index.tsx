'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'i18n/routing';
import { toast } from 'react-toastify';
import ContinueWatchingItem from '../commons/continue-watching-item';
import LoadingSpinner from '../loading/loading-spinner';
import BrandingPlaceholder from '../search/branding-placeholder';
import firebaseServices from 'services/firebase-services';
import { IRecentMovie } from 'types/recent-movie';
import { useTranslations } from 'next-intl';

export default function RecentMoviePage() {
  const t = useTranslations('recent');
  const tToast = useTranslations('toasts');
  const [recentMovies, setRecentMovies] = useState<IRecentMovie[] | []>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const user = useSelector((state: any) => state.auth.user);
  const router = useRouter();

  const getRecentMovies = useCallback(async (userId: string) => {
    if (!userId) return;
    const movies = await firebaseServices.getRecentMovies(userId);
    setRecentMovies(movies);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    getRecentMovies(user?.id);
  }, [user, router, getRecentMovies]);

  const handleDelete = useCallback(
    async (movieId: string) => {
      setRecentMovies((prev) => prev.filter((m) => m.id !== movieId));
      try {
        if (!user?.id) return;
        const ok = await firebaseServices.removeRecentMovie(user.id, movieId);
        if (!ok) throw new Error('Firestore delete failed');
        toast.success(tToast('removedFromRecent'));
      } catch {
        toast.error(tToast('genericError'));
      }
    },
    [user?.id, tToast]
  );

  const renderRecentMovies = () => {
    if (recentMovies.length === 0)
      return (
        <div className="h-full w-full">
          <BrandingPlaceholder />
        </div>
      );

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 container-wrapper">
        {recentMovies.map((movie) => (
          <ContinueWatchingItem
            movie={movie}
            target="detail"
            onDelete={handleDelete}
            key={movie.id}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="pt-16 md:pt-20 space-y-6 md:space-y-8 h-full px-4 md:px-0">
      <div>
        <div className="text-xl md:text-2xl font-bold text-center">{t('title')}</div>
        <div className="text-sm md:text-base text-center mt-1 text-gray-300 px-4 md:px-0">
          {t('subtitle')}
        </div>
      </div>
      {isLoading ? <LoadingSpinner /> : renderRecentMovies()}
    </div>
  );
}
