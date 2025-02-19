import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from 'configs/firebase';
import IComment from 'types/comment';
import { INotification } from 'types/notification';

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
      const commentsCollectionRef = collection(movieCommentsRef, 'comments');
      const querySnapshot = await getDocs(
        query(commentsCollectionRef, orderBy('timeStamp', 'desc'))
      );

      if (querySnapshot.empty) return [];

      const comments: IComment[] = querySnapshot.docs.map((doc) => {
        const docData = doc.data();

        return {
          id: doc.id,
          userName: docData.userName,
          userId: docData.userId,
          userAvata: docData.userAvata,
          text: docData.text,
          timeStamp: docData.timeStamp,
          likes: docData.likes,
        };
      });

      return comments;
    } else {
      return [];
    }
  },

  addMovieComment: async (movieId: string, newComment: IComment) => {
    const movieCommentsDocRef = doc(db, 'movieComments', movieId);
    const commentsCollectionRef = collection(movieCommentsDocRef, 'comments'); // Reference to subcollection
    const docSnapshot = await getDoc(movieCommentsDocRef);

    try {
      if (!docSnapshot.exists()) {
        // if document dont existed, create it
        setDoc(movieCommentsDocRef, { createAt: new Date() });
      }

      // add document to subcollection
      const commentAdded = await addDoc(commentsCollectionRef, newComment);

      return {
        id: commentAdded.id,
        ...newComment,
      };
    } catch (error: any) {
      console.log(error.message);
    }

    return newComment;
  },

  editMovieComment: async (movieId: string, editedCommentText: string, commentId: string) => {
    const commentDocRef = doc(db, 'movieComments', movieId, 'comments', commentId);

    try {
      setDoc(commentDocRef, { text: editedCommentText }, { merge: true });
    } catch (error: any) {
      console.log(error.message);
    }

    return editedCommentText;
  },

  deleteMovieComment: async (movieId: string, commentId: string) => {
    const commentDocRef = doc(db, 'movieComments', movieId, 'comments', commentId);

    try {
      await deleteDoc(commentDocRef);
    } catch (error: any) {
      console.log(error.message);
    }
  },

  likeComment: async (movieId: string, userId: string, comment: IComment) => {
    const commentDocRef = doc(db, 'movieComments', movieId, 'comments', comment.id!);

    try {
      await updateDoc(commentDocRef, {
        likes: arrayUnion(userId),
      });
    } catch (error: any) {
      console.log(error.message);
    }
  },

  unlikeComment: async (movieId: string, userId: string, comment: IComment) => {
    const commentDocRef = doc(db, 'movieComments', movieId, 'comments', comment.id!);

    try {
      await updateDoc(commentDocRef, {
        likes: arrayRemove(userId),
      });
    } catch (error: any) {
      console.log(error.message);
    }
  },

  createNotification: async (reciveNotificationUserId: string, notification: INotification) => {
    try {
      const userNotificationsDocRef = doc(db, 'userNotifications', reciveNotificationUserId);
      const userNotificationCollectionRef = collection(userNotificationsDocRef, "notifications"); 
      
      await setDoc(userNotificationsDocRef, { updateAt: new Date() }, {merge: true});
      await addDoc(userNotificationCollectionRef, notification);
    } catch (error: any) {
      console.log(error)
    }
  },
};

export default firebaseServices;