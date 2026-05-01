import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type MovieCollection from 'types/movie-collection';

export interface CollectionState {
  /** List of movies the logged-in user has added to their personal collection. */
  movies: MovieCollection[];
  /** True once we've fetched (or attempted to fetch) the collection from Firestore. */
  loaded: boolean;
}

const initialState: CollectionState = {
  movies: [],
  loaded: false,
};

export const collectionSlice = createSlice({
  name: 'collection',
  initialState,
  reducers: {
    /** Replace entire collection — used after the initial Firestore fetch. */
    setCollection: (state, action: PayloadAction<MovieCollection[]>) => {
      state.movies = action.payload;
      state.loaded = true;
    },
    /** Optimistic add (caller still writes to Firestore). */
    addToCollection: (state, action: PayloadAction<MovieCollection>) => {
      const exists = state.movies.some((m) => m.id === action.payload.id);
      if (!exists) state.movies.push(action.payload);
    },
    /** Optimistic remove. */
    removeFromCollection: (state, action: PayloadAction<string>) => {
      state.movies = state.movies.filter((m) => m.id !== action.payload);
    },
    /** Clear on logout. */
    clearCollection: (state) => {
      state.movies = [];
      state.loaded = false;
    },
  },
});

export const { setCollection, addToCollection, removeFromCollection, clearCollection } =
  collectionSlice.actions;

export default collectionSlice.reducer;
