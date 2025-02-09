import { useSelector } from 'react-redux';
import IComment from 'types/comment';
import { CiEdit } from 'react-icons/ci';
import { MdDelete } from 'react-icons/md';
import { AiOutlineLike } from 'react-icons/ai';
import firebaseServices from 'services/firebase-services';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import { FaRegComment } from 'react-icons/fa';

export default function CommentControl({
  comment,
  setIsCommentEditing,
  movieId,
  setComments,
}: {
  comment: IComment;
  setIsCommentEditing: React.Dispatch<React.SetStateAction<boolean>>;
  movieId: string;
  setComments: React.Dispatch<React.SetStateAction<[] | IComment[]>>;
}) {
  const user = useSelector((state: any) => state.auth.user);
  const [isCommentOwner, setIsCommentOwner] = useState<boolean>(false);

  useEffect(() => {
    if (user && user.id === comment.userId) {
      setIsCommentOwner(true);
    }
  }, [comment, user]);

  const handleDeleteComment = async () => {
    await firebaseServices.deleteMovieComment(movieId, comment.id!);

    setComments((prev: IComment[]) =>
      prev.filter((prevComment: IComment) => prevComment.id! !== comment.id!)
    );
    toast.success('Đã xóa bình luận');
  };

  const renderCommentActions = () => {
    if (!isCommentOwner) {
      return (
        <div className="cursor-pointer hover:text-white flex items-center gap-1">
          <FaRegComment /> <p>Trả lời</p>
        </div>
      );
    }

    return (
      <>
        <div
          className="cursor-pointer hover:text-white flex items-center gap-1"
          onClick={() => setIsCommentEditing(true)}
        >
          <CiEdit /> <p>Chỉnh sửa</p>
        </div>
        <div
          className="cursor-pointer hover:text-white flex items-center gap-1"
          onClick={handleDeleteComment}
        >
          <MdDelete /> <p>Xóa</p>
        </div>
      </>
    );
  };

  return (
    <div className=" flex gap-x-4 text-gray-400 text-sm">
      <div className={`cursor-pointer hover:text-white flex items-center gap-1`}>
        <AiOutlineLike />
        {isCommentOwner ? comment.likes.length : 'Thích'}
      </div>
      {renderCommentActions()}
    </div>
  );
}
