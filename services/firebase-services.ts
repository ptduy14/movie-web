import { doc, getDoc } from 'firebase/firestore';
import { db } from 'configs/firebase';

const firebaseServices = {
  getMovieCollection: async (userId: string) => {
    const userMovieRef = doc(db, 'userMovies', userId);
    const docSnapshot = await getDoc(userMovieRef);

    if (docSnapshot.exists()) {
      const movies = docSnapshot.data().movies;
      return movies;
    } else {
      return [];
    }
  },
};

export default firebaseServices;
