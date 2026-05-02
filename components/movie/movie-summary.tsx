'use client';

import { useRef, useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';

interface MovieSummaryProps {
  summary: string;
  expandable?: boolean;
}

/**
 * Movie summary block.
 *
 * - Renders raw HTML from the API via `innerHTML` (OPhim returns `<p>` etc.).
 * - When `expandable=true`, shows a "Show more / Show less" toggle once the
 *   content overflows the 3-line clamp (detail page).
 * - When the active locale isn't Vietnamese, renders an "AI translated"
 *   disclaimer to manage user expectations about translation quality.
 *   The disclaimer is rendered locally based on `useLocale()` rather than a
 *   prop, so callers don't have to thread translation state through the tree.
 */
export default function MovieSummary({ summary, expandable = false }: MovieSummaryProps) {
  const t = useTranslations('movie.summary');
  const locale = useLocale();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    if (contentRef.current) contentRef.current.innerHTML = summary;
    setIsExpanded(false);
  }, [summary]);

  useEffect(() => {
    if (!expandable || !contentRef.current) return;
    const el = contentRef.current;
    setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [summary, expandable]);

  const showAiBadge = locale !== 'vi' && summary.trim().length > 0;

  if (!expandable) {
    return (
      <div>
        <div className="limit-movie-summary" ref={contentRef}></div>
        {showAiBadge && (
          <div className="mt-1 text-[10px] md:text-xs text-white/40 italic">
            {t('aiTranslated')}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div ref={contentRef} className={isExpanded ? '' : 'limit-movie-summary'}></div>
      {isOverflowing && (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="mt-2 text-sm font-semibold text-red-400 hover:text-red-300 transition-colors"
        >
          {isExpanded ? t('showLess') : t('showMore')}
        </button>
      )}
      {showAiBadge && (
        <div className="mt-2 text-xs text-white/40 italic">{t('aiTranslated')}</div>
      )}
    </div>
  );
}
