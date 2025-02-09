import IComment from 'types/comment';
import Comment from './comment';

export default function Comments({
  comments,
  movieId,
}: {
  comments: IComment[] | [];
  movieId: string;
}) {
  if (comments.length === 0) return;

  return (
    <div>
      {comments.map((comment: IComment, index: number) => (
        <Comment key={index} comment={comment} movieId={movieId} />
      ))}
    </div>
  );
}
