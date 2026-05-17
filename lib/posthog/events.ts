'use client';

import { posthog } from './client';

type MovieRef = {
  movie_id: string;
  slug: string;
  title: string;
  type?: string;
  genre?: string[];
  country?: string[];
  year?: number;
  thumb_url?: string;
  tmdb_id?: string;
  tmdb_type?: string;
};

type ProgressMilestone = 25 | 50 | 75 | 95;
type AuthMethod = 'email' | 'google';

export const analytics = {
  movieViewed: (m: MovieRef) => posthog.capture('movie_viewed', m),

  moviePlayStarted: (movieId: string, episode: number, server: number) =>
    posthog.capture('movie_play_started', { movie_id: movieId, episode, server }),

  moviePlayProgress: (movieId: string, percent: ProgressMilestone) =>
    posthog.capture('movie_play_progress', { movie_id: movieId, percent }),

  moviePlayCompleted: (movieId: string, watchDuration: number) =>
    posthog.capture('movie_play_completed', { movie_id: movieId, watch_duration: watchDuration }),

  episodeSwitched: (movieId: string, from: number, to: number) =>
    posthog.capture('episode_switched', { movie_id: movieId, from, to }),

  serverSwitched: (movieId: string, from: number, to: number) =>
    posthog.capture('server_switched', { movie_id: movieId, from, to }),

  resumeAccepted: (movieId: string, position: number) =>
    posthog.capture('resume_accepted', { movie_id: movieId, position }),

  resumeRejected: (movieId: string, position: number) =>
    posthog.capture('resume_rejected', { movie_id: movieId, position }),

  searchPerformed: (query: string, resultsCount: number) =>
    posthog.capture('search_performed', { query, results_count: resultsCount }),

  collectionAdded: (movieId: string) => posthog.capture('collection_added', { movie_id: movieId }),

  collectionRemoved: (movieId: string) =>
    posthog.capture('collection_removed', { movie_id: movieId }),

  commentPosted: (movieId: string, commentLength: number) =>
    posthog.capture('comment_posted', { movie_id: movieId, comment_length: commentLength }),

  authSignup: (method: AuthMethod) => posthog.capture('auth_signup', { method }),

  authLogin: (method: AuthMethod) => posthog.capture('auth_login', { method }),

  authLogout: () => posthog.capture('auth_logout'),
};
