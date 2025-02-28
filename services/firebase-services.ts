import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from 'configs/firebase';
import IComment from 'types/comment';
import { INotification } from 'types/notification';
import DetailMovie from 'types/detail-movie';

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
    const movieCommentsDocRef = doc(db, 'movieComments', movieId); 
    const docSnapshot = await getDoc(movieCommentsDocRef);

    if (docSnapshot.exists()) {
      const movieCommentsSubcollectionRef = collection(movieCommentsDocRef, 'comments');
      const q = query(movieCommentsSubcollectionRef, orderBy('timeStamp', 'desc'))
      const querySnapshot = await getDocs(q);

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
    const movieCommentsSubcollectionRef = collection(movieCommentsDocRef, 'comments');
    const docSnapshot = await getDoc(movieCommentsDocRef);

    try {
      if (!docSnapshot.exists()) {
        // if document dont existed, create it
        setDoc(movieCommentsDocRef, { createAt: new Date() });
      }

      // add document to subcollection
      const commentAdded = await addDoc(movieCommentsSubcollectionRef, newComment);

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
      updateDoc(commentDocRef, { text: editedCommentText });
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

  createNotification: async (user: any, comment: IComment, movie: DetailMovie) => {
    // create notification
    const notification: INotification = {
      type: "react",
      userCreatedName: user.name,
      userCreatedId: user.id,
      userReciveId: comment.userId,
      userReciveName: comment.userName,
      timestamp: new Date().toString(),
      movieSlug: movie.movie.slug,
      movieId: movie.movie._id,
      read: false
    }

    try {
      const userNotificationsDocRef = doc(db, 'userNotifications', notification.userReciveId);
      const userNotificationCollectionRef = collection(userNotificationsDocRef, 'notifications');

      await setDoc(userNotificationsDocRef, { updateAt: new Date() }, { merge: true });
      await addDoc(userNotificationCollectionRef, notification);
    } catch (error: any) {
      console.log(error.message);
    }
  },

  deleteNotification: async (userReciveId: string, userCreatedId: string) => {
    try {
      const notificationId = await firebaseServices.findNotificationByUserCreatedId(userReciveId, userCreatedId);

      if (!notificationId) return;

      const mainUserNotificationsDocRef = doc(
        db,
        'userNotifications',
        userReciveId,
        'notifications',
        notificationId
      );
      await deleteDoc(mainUserNotificationsDocRef);
    } catch (error: any) {
      console.log(error.message);
    }
  },

  findNotificationByUserCreatedId: async (userReciveId: string, userCreatedId: string) => {
    try {
      const userNotificationsDocRef = doc(db, 'userNotifications', userReciveId);
      const userNotificationCollectionRef = collection(userNotificationsDocRef, 'notifications');

      const q = query(
        userNotificationCollectionRef,
        where('userCreatedId', '==', userCreatedId),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      const result = querySnapshot.docs[0].id;

      return result;
    } catch (error: any) {
      console.log(error.message);
      return null;
    }
  },

  // REFACTOR LATER: this logic need to refactor when new comment added
  listenToUserNotifications: async (
    userId: string,
    handleReciveNotificationData: (notifications: INotification[]) => void
  ) => {
    const userNotificationsDocRef = doc(db, 'userNotifications', userId);
    const userNotificationCollectionRef = collection(userNotificationsDocRef, 'notifications');

    const q = query(userNotificationCollectionRef);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notifications: INotification[] = [];

      querySnapshot.forEach((doc: DocumentData) => {
        const data: INotification = doc.data();
        notifications.push(data);
      });

      handleReciveNotificationData(notifications);
    });

    return unsubscribe;
  },
};

export default firebaseServices;
