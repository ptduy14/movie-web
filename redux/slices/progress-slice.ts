import { createSlice } from '@reduxjs/toolkit';

export interface A {
  id: string;
  lang: string;
  name: string;
  origin_name: string;
  quality: string;
  slug: string;
  thumb_url: string;
  progress: { id: string; progressTime: number; episodeIndex: number; episodeLink: string };
}

export interface ProgressState {
  progress: A | null;
}

const initialState: ProgressState = {
  progress: null,
};

export const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    setProgress: (state, action) => {
      state.progress = action.payload;
    },
    removeProgress: (state) => {
      state.progress = null;
    },
  },
});

export const { setProgress, removeProgress } = progressSlice.actions;

export default progressSlice.reducer;
