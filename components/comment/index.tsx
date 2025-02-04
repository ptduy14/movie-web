'use client';
import { useEffect, useState } from 'react';
import CommentInput from './comment-input';
import { useSelector } from 'react-redux';
import Comment from './comment';

export default function CommentSection() {
  const user = useSelector((state: any) => state.auth.user);
  const [authenticatedUser, setAuthenticatedUser] = useState<object | null>(null);

  useEffect(() => {
    setAuthenticatedUser(user);
  }, [user]);

  return (
    <>
      <div className="block w-full h-[1px] bg-gray-500"></div>
      {authenticatedUser && <CommentInput authenticatedUser={authenticatedUser} />}
      <div>
        <Comment />
        <Comment />
        <Comment />
      </div>
    </>
  );
}
