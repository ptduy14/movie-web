/**
 * Format a timestamp as a localized relative time ("2 hours ago" / "2 giờ trước").
 *
 * Uses the built-in `Intl.RelativeTimeFormat`, so it's locale-aware without any
 * extra i18n strings. Accepts whatever string was stored on the comment — ISO
 * (new comments) or a `toDateString()` value (older comments) both parse; an
 * unparseable value falls back to the raw string.
 */
export default function formatRelativeTime(timestamp: string, locale: string): string {
  const then = new Date(timestamp).getTime();
  if (Number.isNaN(then)) return timestamp;

  const diffSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (abs < 60) return rtf.format(Math.round(diffSec), 'second');
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 2592000) return rtf.format(Math.round(diffSec / 86400), 'day');
  if (abs < 31536000) return rtf.format(Math.round(diffSec / 2592000), 'month');
  return rtf.format(Math.round(diffSec / 31536000), 'year');
}
