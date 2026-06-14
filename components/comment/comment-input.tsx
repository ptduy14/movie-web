'use client';

import Image from 'next/image';
import AccountDefaultImg from '../../public/account-default-img.jpg';
import { useAuthModel } from '../context/auth-modal-context';
import firebaseServices from 'services/firebase-services';
import { useRef, useState } from 'react';
import IComment from 'types/comment';
import { SetStateAction } from 'react';
import LoadingSpinerBtn from '../loading/loading-spiner-btn';
import DetailMovie from 'types/detail-movie';
import { useTranslations } from 'next-intl';
import { analytics } from 'lib/posthog/events';

export default function CommentInput({
  movie,
  authenticatedUser,
  setComments,
}: {
  movie: DetailMovie;
  authenticatedUser: any;
  setComments: React.Dispatch<SetStateAction<[] | IComment[]>>;
}) {
  const t = useTranslations('comment');
  const [commentText, setCommentText] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const { openAuthModal } = useAuthModel();
  const [isSubmitingComment, setIsSubmitingComment] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  const resetField = () => {
    setCommentText('');
    const el = textareaRef.current;
    if (el) el.style.height = 'auto';
  };

  const handleSubmitComment = () => {
    if (authenticatedUser === null) {
      openAuthModal();
      return;
    }
    if (commentText.trim() === '') return;
    submitComment();
  };

  const submitComment = async () => {
    setIsSubmitingComment(true);

    const comment: IComment = {
      userName: authenticatedUser.name,
      userId: authenticatedUser.id,
      userAvata: authenticatedUser.photo,
      text: commentText.trim(),
      timeStamp: new Date().toISOString(),
      likes: [authenticatedUser.id],
    };

    const commentSubmited = await firebaseServices.addMovieComment(movie.movie._id, comment);

    setComments((prev: IComment[]) => [commentSubmited, ...prev]);

    analytics.commentPosted(movie.movie._id, comment.text.length);
    resetField();
    setIsFocused(false);
    setIsSubmitingComment(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  const handleCancel = () => {
    resetField();
    setIsFocused(false);
    textareaRef.current?.blur();
  };

  const renderUserPhoto = () => {
    if (authenticatedUser === null) return AccountDefaultImg;
    if (authenticatedUser.photo === '') return AccountDefaultImg;
    return authenticatedUser.photo;
  };

  const showActions = isFocused || commentText.trim() !== '';

  return (
    <div className="flex items-start gap-3">
      <Image
        src={renderUserPhoto()}
        alt="User Profile"
        className="h-10 w-10 shrink-0 rounded-full object-cover"
        width={40}
        height={40}
      />
      <div className="min-w-0 flex-1">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={t('placeholder')}
          className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none transition-colors placeholder:text-gray-500 focus:border-[#e20913]"
          value={commentText}
          onChange={(e) => {
            setCommentText(e.target.value);
            autoGrow();
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          data-private
        />

        {showActions && (
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md px-4 py-2 text-sm text-gray-300 transition-colors hover:text-white"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleSubmitComment}
              disabled={isSubmitingComment || commentText.trim() === ''}
              className="rounded-md bg-[#e20913] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#c20810] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitingComment ? <LoadingSpinerBtn /> : t('submit')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
