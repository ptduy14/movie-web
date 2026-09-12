'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import type { CinemaMovie } from 'types/cinema';
import styles from './maintenance.module.css';

/**
 * The cinema schedule shown below the maintenance notice.
 *
 * Strings arrive as props, not through `useTranslations`: the maintenance route
 * deliberately mounts no providers (no NextIntlClientProvider, no Redux, no
 * PostHog, no Firebase), so everything localised is resolved on the server.
 */
export interface CinemaLabels {
  upcomingTitle: string;
  upcomingMeta: string;
  nowPlayingTitle: string;
  nowPlayingMeta: string;
  today: string;
  tomorrow: string;
  /** Contains `{days}`. */
  inDays: string;
  /** Sunday-first, 7 entries. */
  weekdays: string[];
  watchTrailer: string;
  close: string;
}

interface Props {
  upcoming: CinemaMovie[];
  nowPlaying: CinemaMovie[];
  labels: CinemaLabels;
}

interface OpenTrailer {
  key: string;
  title: string;
}

const TMDB_POSTER = `${process.env.NEXT_PUBLIC_TMDB_IMG_DOMAIN}/t/p/w500`;

const posterUrl = (path: string | null) => (path ? `${TMDB_POSTER}${path}` : '');

/** Whole days between today and an ISO date, both at UTC midnight. */
function daysUntil(iso: string, todayIso: string): number {
  const target = Date.parse(`${iso}T00:00:00Z`);
  const today = Date.parse(`${todayIso}T00:00:00Z`);
  return Math.round((target - today) / 86_400_000);
}

export default function CinemaSections({ upcoming, nowPlaying, labels }: Props) {
  const [trailer, setTrailer] = useState<OpenTrailer | null>(null);

  // The page is statically generated, so "today" has to come from the visitor's
  // clock — a build-time countdown would drift a day at a time. Rendered only
  // after mount to keep hydration deterministic.
  const [todayIso, setTodayIso] = useState<string | null>(null);
  useEffect(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
    setTodayIso(local.toISOString().slice(0, 10));
  }, []);

  const groups = useMemo(() => {
    const byDate = new Map<string, CinemaMovie[]>();
    for (const movie of upcoming) {
      const bucket = byDate.get(movie.release_date);
      if (bucket) bucket.push(movie);
      else byDate.set(movie.release_date, [movie]);
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, items]) => ({ date, items }));
  }, [upcoming]);

  // Lock the page behind the lightbox and wire Escape.
  useEffect(() => {
    if (!trailer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTrailer(null);
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [trailer]);

  const countdownFor = (date: string) => {
    if (!todayIso) return null;
    const diff = daysUntil(date, todayIso);
    if (diff <= 0) return { text: labels.today, near: true };
    if (diff === 1) return { text: labels.tomorrow, near: true };
    return { text: labels.inDays.replace('{days}', String(diff)), near: diff <= 7 };
  };

  const card = (movie: CinemaMovie, small = false) => {
    const title = movie.title;
    const playable = Boolean(movie.trailer);
    const open = () => movie.trailer && setTrailer({ key: movie.trailer, title });

    return (
      <article
        key={movie.id}
        className={`${styles.card} ${small ? styles.small : ''} ${playable ? styles.playable : ''}`}
        onClick={playable ? open : undefined}
      >
        <div className={styles.art}>
          <Image
            src={posterUrl(movie.poster_path)}
            alt=""
            fill
            sizes="(max-width: 720px) 40vw, 150px"
          />
          {playable && (
            <button
              type="button"
              className={styles.play}
              aria-label={`${labels.watchTrailer} — ${title}`}
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
              </svg>
            </button>
          )}
          {movie.rating != null && (
            <span className={styles.rate}>{movie.rating.toFixed(1)}</span>
          )}
        </div>
        <h3 className={styles.cardTitle}>{title}</h3>
      </article>
    );
  };

  return (
    <>
      {groups.length > 0 && (
        <section className={styles.section} id="lich-chieu">
          <div className={styles.head}>
            <h2>{labels.upcomingTitle}</h2>
            <span className={styles.meta}>{labels.upcomingMeta}</span>
          </div>

          {groups.map(({ date, items }) => {
            const day = new Date(`${date}T00:00:00Z`);
            const countdown = countdownFor(date);
            return (
              <div className={styles.group} key={date}>
                <div className={styles.when}>
                  <div className={styles.dow}>{labels.weekdays[day.getUTCDay()]}</div>
                  <div className={styles.dm}>
                    {String(day.getUTCDate()).padStart(2, '0')}.
                    {String(day.getUTCMonth() + 1).padStart(2, '0')}
                  </div>
                  <div className={`${styles.countdown} ${countdown?.near ? styles.near : ''}`}>
                    {countdown?.text ?? ''}
                  </div>
                </div>
                <div className={styles.films}>{items.map((m) => card(m))}</div>
              </div>
            );
          })}
        </section>
      )}

      {nowPlaying.length > 0 && (
        <section className={styles.section}>
          <div className={styles.head}>
            <h2>{labels.nowPlayingTitle}</h2>
            <span className={styles.meta}>{labels.nowPlayingMeta}</span>
          </div>
          <div className={styles.rail}>{nowPlaying.map((m) => card(m, true))}</div>
        </section>
      )}

      {trailer && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={trailer.title}
          onClick={(e) => {
            if (e.target === e.currentTarget) setTrailer(null);
          }}
        >
          <div className={styles.lightboxInner}>
            <div className={styles.lightboxBar}>
              <span className={styles.lightboxTitle}>{trailer.title}</span>
              <button
                type="button"
                className={styles.lightboxClose}
                aria-label={labels.close}
                onClick={() => setTrailer(null)}
              >
                &times;
              </button>
            </div>
            <div className={styles.frame}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0`}
                title={trailer.title}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
