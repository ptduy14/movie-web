import IComment from 'types/comment';
import Comment from './comment';

export default function Comments({ comments }: { comments: IComment[] | [] }) {
  console.log(comments);
  
    if (comments.length === 0) return;

  return (
    <div>
      {comments.map((comment: IComment, index: number) => (
        <Comment key={index} comment={comment}/>
      ))}
    </div>
  );
}
