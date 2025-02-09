import Image from 'next/image';
import AccountDefaultImg from '../../public/account-default-img.jpg';
import { useAuthModel } from '../context/auth-modal-context';
import firebaseServices from 'services/firebase-services';
import { useState } from 'react';
import IComment from 'types/comment';
import { SetStateAction } from 'react';
import LoadingSpinerBtn from '../loading/loading-spiner-btn';

export default function CommentInput({
  movieId,
  authenticatedUser,
  setComments,
}: {
  movieId: string;
  authenticatedUser: any;
  setComments: React.Dispatch<SetStateAction<[] | IComment[]>>;
}) {
  const [commentText, setCommentText] = useState<string>('');
  const { openAuthModal } = useAuthModel();
    const [isSubmitingComment, setIsSubmitingComment] = useState<boolean>(false);

  const handleSubmitComment = (e: any) => {
    if (e !== null) e.preventDefault();
    
    if (authenticatedUser === null) {
      openAuthModal();
      return;
    }

    if (commentText === '') return;

    submitComment();
  };

  const submitComment = async () => {
    setIsSubmitingComment(true);

    const comment: IComment = {
      userName: authenticatedUser.name,
      userId: authenticatedUser.id,
      userAvata: authenticatedUser.photo,
      text: commentText,
      timeStamp: new Date().toDateString(),
      likes: []
    };

    const commentSubmited = await firebaseServices.addMovieComment(movieId, comment);

    setComments((prev: IComment[]) => {
        return [commentSubmited, ...prev]
    });

    setCommentText("");
    setIsSubmitingComment(false);
  };

  return (
    <div className='mt-4'>
      <div className="flex items-center space-x-3 border border-gray-300 rounded-lg px-4 py-2 shadow-sm bg-white">
        <div>
          <Image
            src={authenticatedUser ? authenticatedUser.photo : AccountDefaultImg}
            alt="User Profile"
            className="cursor-pointer rounded-full"
            width={40}
            height={40}
          />
        </div>
        <form onSubmit={handleSubmitComment}>
          <input
            type="text"
            placeholder="Write a comment..."
            className="flex-grow bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
        </form>
      </div>
      <div className="text-right mt-3">
        <button
          type="button"
          className="bg-[#e20913] px-5 py-2 rounded-md"
          onClick={handleSubmitComment}
        >
          {isSubmitingComment ? <LoadingSpinerBtn/> : "Bình luận"}
        </button>
      </div>
    </div>
  );
}
