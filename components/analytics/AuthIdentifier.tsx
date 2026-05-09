'use client';

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { posthog } from 'lib/posthog/client';

type AuthUser = {
  id: string;
  email?: string | null;
  name?: string | null;
} | null;

export default function AuthIdentifier() {
  const user = useSelector((state: any) => state.auth.user as AuthUser);
  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentUserId = user?.id ?? null;
    const prevUserId = prevUserIdRef.current;

    if (currentUserId === prevUserId) return;

    if (currentUserId) {
      if (prevUserId && prevUserId !== currentUserId) {
        posthog.reset();
      }
      posthog.identify(currentUserId, {
        email: user?.email ?? undefined,
        name: user?.name ?? undefined,
      });
    } else if (prevUserId) {
      posthog.reset();
    }

    prevUserIdRef.current = currentUserId;
  }, [user]);

  return null;
}
