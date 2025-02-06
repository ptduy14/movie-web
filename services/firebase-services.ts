import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from 'configs/firebase';
import IComment from 'types/comment';

const firebaseServices = {
  getMovieCollection: async (userId: string) => {
    const userMovieRef = doc(db, 'userMovies', userId);
    const docSnapshot = await getDoc(userMovieRef);

    if (docSnapshot.exists()) {
      const movies = docSnapshot.data().movies ?? [];
      return movies;
    } else {
      return [];
    }
  },

  getMovieComments: async (movieId: string) => {
    const movieCommentsRef = doc(db, 'movieComments', movieId);
    const docSnapshot = await getDoc(movieCommentsRef);
    
    if (docSnapshot.exists()) {
        const comments = docSnapshot.data().comments ?? [];
        return comments;
    } else {
        return [];
    }
  },

  addMovieComments: async (movieId: string, newComment: IComment, comments: IComment[] | []) => {
    const movieCommentsRef = doc(db, 'movieComments', movieId);
    const docSnapshot = await getDoc(movieCommentsRef);

    try {
      if (docSnapshot.exists()) {
        await updateDoc(movieCommentsRef, {
          comments: [newComment, ...comments],
        });
      } else {
        await setDoc(movieCommentsRef, {
          comments: [newComment],
        });
      }
    } catch (error: any) {
      console.log(error.message);
    }

    return newComment;
  },
};

export default firebaseServices;
