import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { IRecentMovie } from 'types/recent-movie';

export interface ProgressState {
  movies: Record<string, IRecentMovie>;
}

const initialState: ProgressState = {
  movies: {},
};

export const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    setProgress: (state, action: PayloadAction<IRecentMovie>) => {
      state.movies[action.payload.id] = action.payload;
    },
    removeProgress: (state, action: PayloadAction<string>) => {
      delete state.movies[action.payload];
    },
    clearAllProgress: (state) => {
      state.movies = {};
    },
  },
});

export const { setProgress, removeProgress, clearAllProgress } = progressSlice.actions;

export default progressSlice.reducer;
