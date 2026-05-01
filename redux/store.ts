'use client';
import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from '@reduxjs/toolkit';
import {
  persistReducer,
  createMigrate,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import userSlice from './slices/user-slice';
import storage from './create-storage';
import progressSlice from './slices/progress-slice';
import collectionSlice from './slices/collection-slice';

// v1: migrate progress slice from `{ progress: A | null }`
// to `{ movies: Record<string, IRecentMovie> }`. Reset prior slice shape.
const migrations = {
  1: (state: any) => ({
    ...state,
    progress: { movies: {} },
  }),
};

const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['auth', 'progress'],
  migrate: createMigrate(migrations as any, { debug: false }),
};

// `collection` intentionally NOT persisted — it's source-of-truth-from-Firestore,
// rehydrated by `useCollectionFetcher` on app boot. Persisting could go stale
// across devices.
const rootReducer = combineReducers({
  auth: userSlice,
  progress: progressSlice,
  collection: collectionSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
