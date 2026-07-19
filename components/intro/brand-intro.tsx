'use client';

import { useEffect, useRef, useState } from 'react';
import { whenHomeReady } from 'lib/home-ready';
import styles from './brand-intro.module.css';

/**
 * MOVIEX brand intro — a fixed-duration cinematic wordmark reveal that plays
 * on every visit and doubles as a homepage warm-up window. NOT skippable.
 *
 * Timing model — "fixed floor, capped ceiling":
 *  - The visual reveal runs for a FIXED duration (the CSS keyframes).
 *  - At the floor, we wait for `whenHomeReady()` for at most GRACE_MAX ms so
 *    the reveal ends on a painted home (no skeleton / image pop-in) — but the
 *    grace is hard-capped and NEVER extended to "wait for the network".
 *  - The disclaimer is never part of this budget (config-gated, first-visit
 *    only); the whole warm-up rides on the intro's own on-screen time.
 */

const FLOOR_MS = 1500; // fixed animation core (letters 150–1150 → hold + pulse)
const FLOOR_REDUCED_MS = 300; // reduced-motion: static hold before handoff
const GRACE_MAX_MS = 400; // hard cap waiting for home-ready
const HANDOFF_MS = 500; // dissolve duration (must match overlayOut in the CSS)
const UNMOUNT_BUFFER_MS = 80; // let the dissolve finish before unmount

export default function BrandIntro({ onDone }: { onDone: () => void }) {
  const [handoff, setHandoff] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const floor = reduced ? FLOOR_REDUCED_MS : FLOOR_MS;

    const timers: number[] = [];
    let graceSettled = false;

    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDone();
    };

    const startHandoff = () => {
      if (graceSettled) return;
      graceSettled = true;
      setHandoff(true);
      timers.push(window.setTimeout(finish, HANDOFF_MS + UNMOUNT_BUFFER_MS));
    };

    // Fixed floor, then race home-ready against the hard grace cap.
    timers.push(
      window.setTimeout(() => {
        whenHomeReady().then(startHandoff);
        timers.push(window.setTimeout(startHandoff, GRACE_MAX_MS));
      }, floor)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [onDone]);

  return (
    <div
      className={`${styles.overlay} ${handoff ? styles.handoff : ''}`}
      role="presentation"
      aria-hidden="true"
    >
      <div className={styles.lightLeak} />
      <div className={styles.grain} />
      {/* Decorative wordmark — the disclaimer and header carry the accessible
          brand name, so the overlay stays aria-hidden. */}
      <div className={styles.wordmark}>
        <span className={styles.letter}>M</span>
        <span className={styles.letter}>O</span>
        <span className={styles.letter}>V</span>
        <span className={styles.letter}>I</span>
        <span className={styles.letter}>E</span>
        <span className={styles.letter}>X</span>
      </div>
      <div className={styles.scanline} />
      <div className={styles.vignette} />
    </div>
  );
}
