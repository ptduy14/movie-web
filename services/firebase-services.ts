import { addDoc, collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from 'configs/firebase';
import IComment from 'types/comment';
import { timeStamp } from 'console';

const firebaseServices = {
  getMovieCollection: async (userId: string) => {
    const userMovieRef = doc(db, 'userMovies', userId);
    const docSnapshot = await getDoc(userMovieRef);

    if (docSnapshot.exists()) {
      const commentsCollectionRef = collection(userMovieRef, "comments");
      const querySnapshot = await getDocs(commentsCollectionRef);

      if (querySnapshot.empty) return []

      return querySnapshot.docs.map((doc) => {id: doc.id, doc.data()});
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

  addMovieComments: async (movieId: string, newComment: IComment) => {
    const movieCommentsDocRef = doc(db, 'movieComments', movieId);
    const commentsCollectionRef = collection(movieCommentsDocRef, 'comments'); // Reference to subcollection
    const docSnapshot = await getDoc(movieCommentsDocRef);

    try {
      if (!docSnapshot.exists()) {
        // if document dont existed, create it
        setDoc(movieCommentsDocRef, { createAt: new Date() });
      }

      // add document to subcollection
      addDoc(commentsCollectionRef, newComment);
    } catch (error: any) {
      console.log(error.message);
    }

    return newComment;
  },
};

export default firebaseServices;
