'use client';

import { FaPlus } from 'react-icons/fa';
import { TiTick } from 'react-icons/ti';
import { useSelector, useDispatch } from 'react-redux';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { db } from 'lib/firebase';
import { useAuthModel } from '../context/auth-modal-context';
import LoadingSpinerBtn from '../loading/loading-spiner-btn';
import {
  addToCollection,
  removeFromCollection,
} from '../../redux/slices/collection-slice';
import type MovieCollection from 'types/movie-collection';

interface Props {
  collectionItem: MovieCollection;
}

/**
 * Add/Remove button shown inside the hover overlay of movie cards.
 *
 * Reads `state.collection.movies` (cached once at app boot by
 * `useCollectionFetcher`) — so 50 cards on home page = 0 extra Firestore reads.
 * Click writes to Firestore + dispatches optimistic Redux update so all other
 * cards re-render with the correct icon instantly.
 *
 * Click handling:
 *  - `e.preventDefault()` + `e.stopPropagation()` to suppress the surrounding
 *    <Link> navigation (cards wrap their entire body in a <Link>).
 *  - `pointer-events-auto` so it remains clickable even though the overlay
 *    container has `pointer-events-none`.
 */
export default function AddToCollectionOverlayBtn({ collectionItem }: Props) {
  const tCard = useTranslations('card');
  const tToast = useTranslations('toasts');
  const user = useSelector((state: any) => state.auth.user);
  const isInCollection = useSelector((state: any) =>
    (state.collection.movies as MovieCollection[]).some(
      (m) => m.id === collectionItem.id
    )
  );
  const dispatch = useDispatch();
  const { openAuthModal } = useAuthModel();
  const [isHandling, setIsHandling] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      openAuthModal();
      return;
    }
    if (isHandling) return;

    setIsHandling(true);
    try {
      const userMoviesRef = doc(db, 'userMovies', user.id);

      if (isInCollection) {
        // Remove path — Firestore arrayRemove on object can be tricky with merge,
        // so read-modify-write is safer for this small array.
        const snapshot = await getDoc(userMoviesRef);
        if (snapshot.exists()) {
          const existing = (snapshot.data().movies as MovieCollection[]) || [];
          const updated = existing.filter((m) => m.id !== collectionItem.id);
          await updateDoc(userMoviesRef, { movies: updated });
        }
        dispatch(removeFromCollection(collectionItem.id));
        toast.success(tToast('removedFromCollection'));
      } else {
        // Add path
        const snapshot = await getDoc(userMoviesRef);
        if (snapshot.exists()) {
          await updateDoc(userMoviesRef, {
            movies: arrayUnion(collectionItem),
          });
        } else {
          await setDoc(userMoviesRef, { movies: [collectionItem] });
        }
        dispatch(addToCollection(collectionItem));
        toast.success(tToast('addedToCollection'));
      }
    } catch (err: any) {
      console.log(err.message);
      toast.error(tToast('genericError'));
    } finally {
      setIsHandling(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isHandling}
      title={isInCollection ? tCard('removeFromCollection') : tCard('addToCollection')}
      aria-label={isInCollection ? tCard('removeFromCollection') : tCard('addToCollection')}
      aria-pressed={isInCollection}
      className={[
        'pointer-events-auto flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full border backdrop-blur-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
        isInCollection
          ? 'bg-emerald-500/30 border-emerald-400 hover:bg-emerald-500/50'
          : 'bg-white/15 border-white/40 hover:bg-white/40 hover:border-white',
      ].join(' ')}
    >
      {isHandling ? (
        <LoadingSpinerBtn />
      ) : isInCollection ? (
        <TiTick className="text-white text-base md:text-lg" />
      ) : (
        <FaPlus className="text-white text-[10px] md:text-xs" />
      )}
    </button>
  );
}
