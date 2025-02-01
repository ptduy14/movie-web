'use client';
import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from '@reduxjs/toolkit';
import { persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
//import storage from 'redux-persist/lib/storage';
import userSlice from "./slices/user-slice"
import storage from './create-storage';
import progressSlice from './slices/progress-slice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'progress'],
};

const rootReducer = combineReducers({ auth: userSlice, progress: progressSlice });

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

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch;
