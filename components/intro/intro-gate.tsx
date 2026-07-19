'use client';

import { useState } from 'react';
import BrandIntro from './brand-intro';

/**
 * Plays the MOVIEX brand intro on top of the app on every visit, while the
 * children (homepage + disclaimer) mount and warm up BEHIND the opaque overlay.
 *
 * `introDone` starts false and is SSR'd, so the overlay is present in the very
 * first HTML paint — no flash of homepage before hydration. When the intro
 * finishes it unmounts, revealing whatever is behind (the disclaimer for a
 * first-time user, otherwise the ready homepage).
 */
export default function IntroGate({ children }: { children: React.ReactNode }) {
  const [introDone, setIntroDone] = useState(false);

  return (
    <>
      {children}
      {!introDone && <BrandIntro onDone={() => setIntroDone(true)} />}
    </>
  );
}
