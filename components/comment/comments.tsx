import IComment from 'types/comment';
import Comment from './comment';

export default function Comments({
  comments,
  movieId,
  setComments
}: {
  comments: IComment[] | [];
  movieId: string;
  setComments: React.Dispatch<React.SetStateAction<[] | IComment[]>>
}) {
  if (comments.length === 0) return;

  return (
    <div>
      {comments.map((comment: IComment, index: number) => (
        <Comment key={index} comment={comment} movieId={movieId} setComments={setComments}/>
      ))}
    </div>
  );
}
