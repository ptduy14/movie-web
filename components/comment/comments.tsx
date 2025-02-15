import IComment from 'types/comment';
import Comment from './comment';
import DetailMovie from 'types/detail-movie';

export default function Comments({
  comments,
  movie,
  setComments
}: {
  comments: IComment[] | [];
  movie: DetailMovie;
  setComments: React.Dispatch<React.SetStateAction<[] | IComment[]>>
}) {
  if (comments.length === 0) return;

  return (
    <div>
      {comments.map((comment: IComment, index: number) => (
        <Comment key={index} comment={comment} movie={movie} setComments={setComments}/>
      ))}
    </div>
  );
}
