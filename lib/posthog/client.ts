'use client';

import posthog from 'posthog-js';

let initialized = false;

export function initPostHog(): void {
  if (typeof window === 'undefined') return;
  if (initialized) return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  const uiHost = process.env.NEXT_PUBLIC_POSTHOG_UI_HOST;
  const isDev = process.env.NODE_ENV === 'development';
  const enableInDev = process.env.NEXT_PUBLIC_POSTHOG_ENABLE_DEV === 'true';

  if (isDev && !enableInDev) {
    console.info('[PostHog] disabled in dev (set NEXT_PUBLIC_POSTHOG_ENABLE_DEV=true to enable)');
    return;
  }

  if (!key) {
    if (isDev) {
      console.warn('[PostHog] NEXT_PUBLIC_POSTHOG_KEY is missing — analytics disabled');
    }
    return;
  }

  posthog.init(key, {
    api_host: apiHost,
    ui_host: uiHost,
    capture_pageview: false,
    capture_pageleave: true,
    persistence: 'localStorage',
    autocapture: true,
    respect_dnt: true,
    disable_session_recording: isDev,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-private]',
    },
    loaded: (ph) => {
      if (isDev) ph.debug();
    },
  });

  initialized = true;
}

export { posthog };
