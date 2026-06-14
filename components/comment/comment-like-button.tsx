'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { AiOutlineLike, AiFillLike } from 'react-icons/ai';
import firebaseServices from 'services/firebase-services';
import { useAuthModel } from '../context/auth-modal-context';
import IComment from 'types/comment';
import DetailMovie from 'types/detail-movie';
import { useTranslations } from 'next-intl';

/**
 * Like toggle for a comment. Extracted from the old CommentControl so the
 * comment footer holds only the like action (edit/delete moved to the comment
 * header). Brand-red when liked.
 */
export default function CommentLikeButton({
  comment,
  movie,
}: {
  comment: IComment;
  movie: DetailMovie;
}) {
  const t = useTranslations('comment');
  const user = useSelector((state: any) => state.auth.user);
  const { openAuthModal } = useAuthModel();
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);

  useEffect(() => {
    setIsLiked(comment.likes.some((userLiked: string) => userLiked === user?.id));
    setLikeCount(comment.likes.length);
  }, [comment, user]);

  const handleToggleLike = async () => {
    if (!user) {
      openAuthModal();
      return;
    }

    if (isLiked) {
      setIsLiked(false);
      setLikeCount((prev) => prev - 1);
      await firebaseServices.unlikeComment(movie.movie._id, user.id, comment);
      await firebaseServices.deleteNotification(comment.userId, user.id);
      return;
    }

    setIsLiked(true);
    setLikeCount((prev) => prev + 1);
    await firebaseServices.likeComment(movie.movie._id, user.id, comment);

    if (user.id === comment.userId) return;
    await firebaseServices.createNotification(user, comment, movie);
  };

  return (
    <button
      type="button"
      onClick={handleToggleLike}
      className={`flex items-center gap-1.5 py-2 text-sm transition-colors ${
        isLiked ? 'text-[#e20913]' : 'text-gray-400 hover:text-white'
      }`}
    >
      {isLiked ? <AiFillLike size={16} /> : <AiOutlineLike size={16} />}
      {likeCount > 0 && <span className="tabular-nums">{likeCount}</span>}
      <span>{t('like')}</span>
    </button>
  );
}
