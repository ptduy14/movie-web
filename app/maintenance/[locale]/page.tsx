import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { routing } from 'i18n/routing';
import { readCinemaData } from 'lib/cinema-data';
import CinemaSections from '@/components/maintenance/cinema-sections';
import styles from '@/components/maintenance/maintenance.module.css';

/**
 * The maintenance screen. Reached only through the rewrite in `middleware.ts`
 * when `MAINTENANCE_MODE=true`; when it's off, middleware redirects this path
 * back to the home page.
 *
 * Fully static: the cinema schedule comes from `public/data/cinema.json`
 * (baked daily by `.github/workflows/cinema-cron.yml`), so rendering this page
 * makes zero network calls — a page that announces an outage must not be able
 * to have one of its own.
 */
export const dynamic = 'force-static';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function MaintenancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as any)) notFound();

  const t = await getTranslations({ locale, namespace: 'maintenance' });
  const cinema = await readCinemaData();
  const hasSchedule = cinema.upcoming.length > 0 || cinema.now_playing.length > 0;

  return (
    <div className={`${styles.page} ${hasSchedule ? '' : styles.bare}`}>
      <div className={styles.glow} />

      <header className={styles.hero}>
        <div className={styles.heroBody}>
          <div className={styles.wordmark}>MOVIEX</div>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.note}>{t('note')}</p>
        </div>

        {hasSchedule && (
          <a className={styles.cue} href="#lich-chieu">
            {t('scrollCue')}
            <span className={styles.arrow} />
          </a>
        )}
      </header>

      {hasSchedule && (
        <main className={styles.wrap}>
          <CinemaSections
            upcoming={cinema.upcoming}
            nowPlaying={cinema.now_playing}
            locale={locale}
            labels={{
              upcomingTitle: t('cinema.upcomingTitle'),
              upcomingMeta: t('cinema.upcomingMeta'),
              nowPlayingTitle: t('cinema.nowPlayingTitle'),
              nowPlayingMeta: t('cinema.nowPlayingMeta'),
              today: t('cinema.today'),
              tomorrow: t('cinema.tomorrow'),
              // `.raw()` keeps `{days}` unexpanded — the count is only known in
              // the browser, where the countdown is computed.
              inDays: t.raw('cinema.inDays') as string,
              weekdays: t.raw('cinema.weekdays') as string[],
              watchTrailer: t('cinema.watchTrailer'),
              close: t('cinema.close'),
            }}
          />
        </main>
      )}

      <footer className={`${styles.footer} ${hasSchedule ? '' : styles.footerBare}`}>
        © {new Date().getFullYear()} MOVIEX
      </footer>
    </div>
  );
}
