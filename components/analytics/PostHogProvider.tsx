'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { initPostHog, posthog } from 'lib/posthog/client';
import AuthIdentifier from './AuthIdentifier';

function PageviewTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || typeof window === 'undefined') return;

    const queryString = searchParams?.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    const locale = pathname.split('/').filter(Boolean)[0] ?? null;

    posthog.capture('$pageview', {
      $current_url: window.location.origin + url,
      locale,
    });
  }, [pathname, searchParams]);

  return null;
}

function PageviewTracker() {
  return (
    <Suspense fallback={null}>
      <PageviewTrackerInner />
    </Suspense>
  );
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Defer PostHog's init (and whatever extension scripts it decides to
    // pull in, e.g. the session-recording recorder) until the main thread
    // is idle rather than competing with initial render/hydration work.
    // `timeout` guarantees it still runs even if the page never goes idle.
    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(() => initPostHog(), { timeout: 2000 });
      return () => window.cancelIdleCallback(handle);
    }
    const timeoutId = window.setTimeout(initPostHog, 1);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <PHProvider client={posthog}>
      <PageviewTracker />
      <AuthIdentifier />
      {children}
    </PHProvider>
  );
}
