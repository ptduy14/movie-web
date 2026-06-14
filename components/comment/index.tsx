'use client';
import { useEffect, useMemo, useState } from 'react';
import CommentInput from './comment-input';
import { useSelector } from 'react-redux';
import firebaseServices from 'services/firebase-services';
import Comments from './comments';
import IComment from 'types/comment';
import DetailMovie from 'types/detail-movie';
import { useTranslations } from 'next-intl';

type SortMode = 'newest' | 'top';

export default function CommentSection({ movie }: { movie: DetailMovie }) {
  const t = useTranslations('comment');
  const user = useSelector((state: any) => state.auth.user);
  const [authenticatedUser, setAuthenticatedUser] = useState<object | null>(null);
  const [comments, setComments] = useState<IComment[] | []>([]);
  const [isFetchingComments, setIsFetchingComments] = useState<boolean>(true);
  const [sort, setSort] = useState<SortMode>('newest');

  useEffect(() => {
    setAuthenticatedUser(user);
  }, [user]);

  useEffect(() => {
    getMovieComments();
  }, []);

  const getMovieComments = async () => {
    const commentsResponse = await firebaseServices.getMovieComments(movie.movie._id);
    setComments(commentsResponse);
    setIsFetchingComments(false);
  };

  const sortedComments = useMemo(() => {
    const list = [...comments];
    if (sort === 'top') {
      list.sort((a, b) => b.likes.length - a.likes.length);
    } else {
      list.sort(
        (a, b) => new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime()
      );
    }
    return list;
  }, [comments, sort]);

  return (
    <div className="space-y-6">
      {/* Header: count + sort */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-bold lg:text-xl">
          {t('heading')}
          {!isFetchingComments && comments.length > 0 && (
            <span className="text-sm font-normal text-gray-400">· {comments.length}</span>
          )}
        </h3>

        {!isFetchingComments && comments.length > 1 && (
          <div className="flex items-center gap-1 rounded-lg border border-white/10 p-0.5 text-sm">
            <button
              type="button"
              onClick={() => setSort('newest')}
              className={`rounded-md px-3 py-2 transition-colors ${
                sort === 'newest' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('sortNewest')}
            </button>
            <button
              type="button"
              onClick={() => setSort('top')}
              className={`rounded-md px-3 py-2 transition-colors ${
                sort === 'top' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('sortTop')}
            </button>
          </div>
        )}
      </div>

      <CommentInput
        authenticatedUser={authenticatedUser}
        movie={movie}
        setComments={setComments}
      />

      {!isFetchingComments &&
        (comments.length === 0 ? (
          <p className="py-4 text-sm text-gray-400">{t('empty')}</p>
        ) : (
          <Comments movie={movie} comments={sortedComments} setComments={setComments} />
        ))}
    </div>
  );
}
