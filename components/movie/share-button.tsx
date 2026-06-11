'use client';

import { FaShareAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useTranslations } from 'next-intl';

/**
 * Share the current movie URL. Uses the Web Share API on supporting devices
 * (mobile share sheet); falls back to copying the link to the clipboard with a
 * toast on desktop browsers that lack it.
 */
export default function ShareButton({ title }: { title: string }) {
  const t = useTranslations('movie');

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User dismissed the share sheet — not an error.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('linkCopied'));
    } catch {
      // Clipboard blocked (insecure context / permissions) — silently ignore.
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={t('share')}
      className="flex items-center gap-x-2 rounded-md bg-white/15 px-4 py-2 font-semibold text-white transition duration-200 ease-in-out hover:bg-white/25"
    >
      <FaShareAlt size={16} />
      <span className="leading-4">{t('share')}</span>
    </button>
  );
}
