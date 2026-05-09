'use client';

import posthog from 'posthog-js';

let initialized = false;

export function initPostHog(): void {
  if (typeof window === 'undefined') return;
  if (initialized) return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  const uiHost = process.env.NEXT_PUBLIC_POSTHOG_UI_HOST;

  if (!key) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[PostHog] NEXT_PUBLIC_POSTHOG_KEY is missing — analytics disabled');
    }
    return;
  }

  posthog.init(key, {
    api_host: apiHost,
    ui_host: uiHost,
    capture_pageview: false,
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
    autocapture: true,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-private]',
    },
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') ph.debug();
    },
  });

  initialized = true;
}

export { posthog };
