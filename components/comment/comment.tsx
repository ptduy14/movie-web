'use client';

import Image from 'next/image';
import AccountDefaultImg from '../../public/account-default-img.jpg';
import IComment from 'types/comment';
import CommentLikeButton from './comment-like-button';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import firebaseServices from 'services/firebase-services';
import DetailMovie from 'types/detail-movie';
import { toast } from 'react-toastify';
import { useLocale, useTranslations } from 'next-intl';
import { CiEdit } from 'react-icons/ci';
import { MdDelete } from 'react-icons/md';
import formatRelativeTime from 'utils/format-relative-time';

export default function Comment({
  comment,
  movie,
  setComments,
}: {
  comment: IComment;
  movie: DetailMovie;
  setComments: React.Dispatch<React.SetStateAction<[] | IComment[]>>;
}) {
  const t = useTranslations('comment');
  const locale = useLocale();
  const user = useSelector((state: any) => state.auth.user);
  const isOwner = Boolean(user && user.id === comment.userId);
  const [isCommentEditing, setIsCommentEditing] = useState<boolean>(false);
  const [commentText, setCommentText] = useState<string>('');

  useEffect(() => {
    setCommentText(comment.text);
  }, [comment]);

  const handleSubmitEditedComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim() === '') return;
    await firebaseServices.editMovieComment(movie.movie._id, commentText.trim(), comment.id!);
    setIsCommentEditing(false);
  };

  const handleCancelEdit = () => {
    setCommentText(comment.text);
    setIsCommentEditing(false);
  };

  const handleDelete = async () => {
    await firebaseServices.deleteMovieComment(movie.movie._id, comment.id!);
    setComments((prev: IComment[]) => prev.filter((c: IComment) => c.id! !== comment.id!));
    toast.success(t('deleted'));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCommentEditing) handleCancelEdit();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCommentEditing]);

  return (
    <div className="flex gap-3 py-4">
      <Image
        src={comment.userAvata || AccountDefaultImg}
        alt="User Profile"
        className="h-10 w-10 shrink-0 rounded-full object-cover"
        width={40}
        height={40}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-white">{comment.userName}</span>
            {isOwner && (
              <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-gray-300">
                {t('you')}
              </span>
            )}
            <span className="text-xs text-gray-400">
              {formatRelativeTime(comment.timeStamp, locale)}
            </span>
          </div>

          {isOwner && !isCommentEditing && (
            <div className="flex shrink-0 items-center gap-4 text-gray-400">
              <button
                type="button"
                onClick={() => setIsCommentEditing(true)}
                className="flex items-center gap-1 py-2 text-sm transition-colors hover:text-white"
              >
                <CiEdit size={16} /> {t('edit')}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1 py-2 text-sm transition-colors hover:text-white"
              >
                <MdDelete size={16} /> {t('delete')}
              </button>
            </div>
          )}
        </div>

        {isCommentEditing ? (
          <form onSubmit={handleSubmitEditedComment} className="mt-2">
            <textarea
              autoFocus
              rows={2}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full resize-none rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-base text-white outline-none transition-colors focus:border-white/30"
              data-private
            />
            <div className="mt-2 flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-[#e20913] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#c20810]"
              >
                {t('save')}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-md px-3 py-1.5 text-sm text-gray-300 transition-colors hover:text-white"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-1 whitespace-pre-line break-words text-white" data-private>
            {commentText}
          </p>
        )}

        {!isCommentEditing && (
          <div className="mt-2">
            <CommentLikeButton comment={comment} movie={movie} />
          </div>
        )}
      </div>
    </div>
  );
}
