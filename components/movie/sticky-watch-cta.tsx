'use client';

import { useEffect, useState } from 'react';
import { FaPlay } from 'react-icons/fa';
import { Link } from 'i18n/routing';
import { useTranslations } from 'next-intl';

/**
 * Mobile-only sticky "Watch" button for the detail page. The hero's Watch CTA
 * scrolls away on a long page, so this appears once the user scrolls past the
 * hero — standard Netflix/Prime mobile pattern. Sits just above the bottom tab
 * bar (which is ~3.25rem + safe-area tall).
 */
export default function StickyWatchCta({ slug, isTrailer }: { slug: string; isTrailer: boolean }) {
  const t = useTranslations('movie');
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isTrailer) return;
    const onScroll = () => setShow(window.scrollY > 380);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isTrailer]);

  if (isTrailer) return null;

  return (
    <div
      className={`lg:hidden fixed inset-x-0 z-20 px-4 transition-all duration-300 ease-out bottom-[calc(3.25rem+env(safe-area-inset-bottom))] ${
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
      aria-hidden={!show}
    >
      <Link
        href={`/movies/watch/${slug}`}
        className="flex min-h-[48px] w-full items-center justify-center gap-x-2 rounded-lg bg-[#e20913] font-semibold uppercase text-white shadow-custom transition-colors hover:bg-[#c20810]"
      >
        <FaPlay size={18} />
        {t('watch')}
      </Link>
    </div>
  );
}
