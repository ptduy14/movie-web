'use client';
import { useTranslations } from 'next-intl';

interface NewUpdateBadgeProps {
  /** ISO 8601 timestamp string from `modified.time` */
  modifiedAt?: string;
  /** Threshold in hours — default 24h */
  thresholdHours?: number;
}

const HOUR_MS = 60 * 60 * 1000;

/**
 * "MỚI" badge — shown when the movie was modified within the threshold window.
 * Returns null if `modifiedAt` is missing/invalid or older than threshold.
 */
export default function NewUpdateBadge({
  modifiedAt,
  thresholdHours = 24,
}: NewUpdateBadgeProps) {
  const t = useTranslations('card');
  if (!modifiedAt) return null;

  const modifiedTime = Date.parse(modifiedAt);
  if (Number.isNaN(modifiedTime)) return null;

  const diffHours = (Date.now() - modifiedTime) / HOUR_MS;
  if (diffHours < 0 || diffHours > thresholdHours) return null;

  return (
    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-red-600 text-white shadow animate-pulse">
      {t('newBadge')}
    </span>
  );
}
