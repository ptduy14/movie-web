import { useSelector } from 'react-redux';
import IComment from 'types/comment';
import { CiEdit } from 'react-icons/ci';
import { MdDelete } from 'react-icons/md';
import { AiOutlineLike } from 'react-icons/ai';
import { useEffect } from 'react';

export default function CommentControl({
  comment,
  isCommentEditing,
  setIsCommentEditing,
}: {
  comment: IComment;
  isCommentEditing: boolean;
  setIsCommentEditing: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const user = useSelector((state: any) => state.auth.user);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCommentEditing) setIsCommentEditing(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCommentEditing]);

  const handleDeleteComment = () => {
    console.log(comment);
  }

  const renderCommentActions = () => {
    if (!user && user.id !== comment.userId) return;

    return (
      <>
        <div
          className="cursor-pointer hover:text-white flex items-center gap-1"
          onClick={() => setIsCommentEditing(true)}
        >
          <CiEdit /> <p>Chỉnh sửa</p>
        </div>
        <div className="cursor-pointer hover:text-white flex items-center gap-1" onClick={handleDeleteComment}>
          <MdDelete /> <p>Xóa</p>
        </div>
      </>
    );
  };

  return (
    <div className=" flex gap-x-4 text-gray-400 text-sm">
      <div className="cursor-pointer hover:text-white flex items-center gap-1">
        <AiOutlineLike />
        Thích
      </div>
      {renderCommentActions()}
    </div>
  );
}
