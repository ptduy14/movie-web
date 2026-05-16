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
import { db } from 'lib/firebase';
import IComment from 'types/comment';
import { INotification } from 'types/notification';
import DetailMovie from 'types/detail-movie';
import { toast } from 'react-toastify';
import { IRecentMovie } from 'types/recent-movie';

const firebaseServices = {
  getMovieCollection: async (userId: string) => {
    try {
      const userMovieRef = doc(db, 'userMovies', userId);
      const docSnapshot = await getDoc(userMovieRef);

      if (docSnapshot.exists()) {
        const movies = docSnapshot.data().movies ?? [];
        return movies;
      } else {
        return [];
      }
    } catch (error: any) {
      toast.error('Đã có lỗi xảy ra...');
      console.log(error.message);
    }
  },

  getMovieComments: async (movieId: string) => {
    try {
      const movieCommentsDocRef = doc(db, 'movieComments', movieId);
      const docSnapshot = await getDoc(movieCommentsDocRef);

      if (docSnapshot.exists()) {
        const movieCommentsSubcollectionRef = collection(movieCommentsDocRef, 'comments');
        const q = query(movieCommentsSubcollectionRef, orderBy('timeStamp', 'desc'));
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
    } catch (error: any) {
      toast.error('Đã có lỗi xảy ra...');
      console.log(error.message);
      return [];
    }
  },

  addMovieComment: async (movieId: string, newComment: IComment) => {
    try {
      const movieCommentsDocRef = doc(db, 'movieComments', movieId);
      const movieCommentsSubcollectionRef = collection(movieCommentsDocRef, 'comments');
      const docSnapshot = await getDoc(movieCommentsDocRef);

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
      toast.error('Đã có lỗi xảy ra...');
      console.log(error.message);
      return newComment;
    }
  },

  editMovieComment: async (movieId: string, editedCommentText: string, commentId: string) => {
    try {
      const commentDocRef = doc(db, 'movieComments', movieId, 'comments', commentId);
      updateDoc(commentDocRef, { text: editedCommentText });
    } catch (error: any) {
      toast.error('Đã có lỗi xảy ra...');
      console.log(error.message);
    } finally {
      return editedCommentText;
    }
  },

  deleteMovieComment: async (movieId: string, commentId: string) => {
    try {
      const commentDocRef = doc(db, 'movieComments', movieId, 'comments', commentId);
      await deleteDoc(commentDocRef);
    } catch (error: any) {
      toast.error('Đã có lỗi xảy ra...');
      console.log(error.message);
    }
  },

  likeComment: async (movieId: string, userId: string, comment: IComment) => {
    try {
      const commentDocRef = doc(db, 'movieComments', movieId, 'comments', comment.id!);
      await updateDoc(commentDocRef, {
        likes: arrayUnion(userId),
      });
    } catch (error: any) {
      toast.error('Đã có lỗi xảy ra...');
      console.log(error.message);
    }
  },

  unlikeComment: async (movieId: string, userId: string, comment: IComment) => {
    try {
      const commentDocRef = doc(db, 'movieComments', movieId, 'comments', comment.id!);
      await updateDoc(commentDocRef, {
        likes: arrayRemove(userId),
      });
    } catch (error: any) {
      toast.error('Đã có lỗi xảy ra...');
      console.log(error.message);
    }
  },

  createNotification: async (user: any, comment: IComment, movie: DetailMovie) => {
    try {
      // create notification
      const notification: INotification = {
        type: 'react',
        userCreatedName: user.name,
        userCreatedId: user.id,
        userReciveId: comment.userId,
        userReciveName: comment.userName,
        timestamp: new Date().toString(),
        movieSlug: movie.movie.slug,
        movieId: movie.movie._id,
        read: false,
      };

      const userNotificationsDocRef = doc(db, 'userNotifications', notification.userReciveId);
      const userNotificationCollectionRef = collection(userNotificationsDocRef, 'notifications');

      await setDoc(userNotificationsDocRef, { updateAt: new Date() }, { merge: true });
      await addDoc(userNotificationCollectionRef, notification);
    } catch (error: any) {
      toast.error('Đã có lỗi xảy ra...');
      console.log(error.message);
    }
  },

  deleteNotification: async (userReciveId: string, userCreatedId: string) => {
    try {
      const notificationId = await firebaseServices.findNotificationByUserCreatedId(
        userReciveId,
        userCreatedId
      );

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

  readedNotification: async (notification: INotification) => {
    const userNotificationDocRef = doc(
      db,
      'userNotifications',
      notification.userReciveId,
      'notifications',
      notification.id!
    );
    setDoc(userNotificationDocRef, { read: true }, { merge: true });
  },

  // REFACTOR LATER: this logic need to refactor when new comment added
  listenToUserNotifications: async (
    userId: string,
    handleReciveNotificationData: (notifications: INotification[]) => void
  ) => {
    try {
      const userNotificationCollectionRef = collection(
        db,
        'userNotifications',
        userId,
        'notifications'
      );

      const q = query(userNotificationCollectionRef);

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications: INotification[] = [];

        querySnapshot.forEach((doc: DocumentData) => {
          const data: INotification = { id: doc.id, ...doc.data() };
          notifications.push(data);
        });

        handleReciveNotificationData(notifications);
      });

      return unsubscribe;
    } catch (error: any) {
      console.log(error.message);
    }
  },

  // ─── recentMovies collection ──────────────────────────────────────────────

  /** List all recent-watched entries for a user (unsorted). */
  getRecentMovies: async (userId: string): Promise<IRecentMovie[]> => {
    try {
      const ref = collection(db, 'recentMovies', userId, 'movies');
      const res = await getDocs(ref);
      if (res.empty) return [];
      return res.docs.map((d: DocumentData) => ({ id: d.id, ...d.data() }) as IRecentMovie);
    } catch (error: any) {
      console.log(error.message);
      return [];
    }
  },

  /** Fetch one recent-watched entry. Returns null when missing or on error. */
  getRecentMovie: async (userId: string, movieId: string): Promise<IRecentMovie | null> => {
    try {
      const ref = doc(db, 'recentMovies', userId, 'movies', movieId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as IRecentMovie;
    } catch {
      return null;
    }
  },

  /** Delete one recent-watched entry. Returns false on failure (non-fatal). */
  removeRecentMovie: async (userId: string, movieId: string): Promise<boolean> => {
    try {
      const ref = doc(db, 'recentMovies', userId, 'movies', movieId);
      await deleteDoc(ref);
      return true;
    } catch (error: any) {
      console.log('removeRecentMovie error:', error.message);
      return false;
    }
  },

  /** Upsert watch progress. `updatedAt` stamped client-side for numeric sort. */
  updateWatchProgress: async (recentMovie: IRecentMovie, userId: string): Promise<void> => {
    try {
      const ref = doc(db, 'recentMovies', userId, 'movies', recentMovie.id);
      await setDoc(
        ref,
        { ...recentMovie, userId, updatedAt: Date.now() },
        { merge: true }
      );
    } catch (error: any) {
      console.log('updateWatchProgress error:', error.message);
    }
  },
};

export default firebaseServices;
