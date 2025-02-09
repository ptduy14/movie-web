'use client';
import { useEffect, useState } from 'react';
import CommentInput from './comment-input';
import { useSelector } from 'react-redux';
import firebaseServices from 'services/firebase-services';
import Comments from './comments';
import IComment from 'types/comment';

export default function CommentSection({ movieId }: { movieId: string }) {
  const user = useSelector((state: any) => state.auth.user);
  const [authenticatedUser, setAuthenticatedUser] = useState<object | null>(null);
  const [comments, setComments] = useState<IComment[] | []>([]);
  const [isFetchingComments, setIsFetchingComments] = useState<boolean>(true);

  useEffect(() => {
    setAuthenticatedUser(user);
  }, [user]);

  useEffect(() => {
    getMovieComments();
  }, []);

  const getMovieComments = async () => {
    const commentsResponse = await firebaseServices.getMovieComments(movieId);
    setComments(commentsResponse);
    setIsFetchingComments(false);
  };

  return (
    <>
      <div className="block w-full h-[1px] bg-gray-500"></div>
      <CommentInput
        authenticatedUser={authenticatedUser}
        movieId={movieId}
        setComments={setComments}
      />
      {!isFetchingComments && <Comments movieId={movieId} comments={comments} />}
    </>
  );
}
