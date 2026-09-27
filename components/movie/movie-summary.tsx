'use client';

import { useRef, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface MovieSummaryProps {
  summary: string;
  expandable?: boolean;
  /**
   * True when this text was machine-translated rather than supplied by the
   * catalog in this language. Decided upstream by comparing the content's
   * language against the active locale — the component can't tell by looking.
   */
  aiTranslated?: boolean;
}

/**
 * Movie summary block.
 *
 * - Renders the synopsis as TEXT. The catalog returns plain prose with no
 *   markup, so there is nothing to parse — and assigning to `textContent`
 *   instead of `innerHTML` closes an injection sink that only existed
 *   because the previous provider embedded `<p>` tags in its synopses.
 * - When `expandable=true`, shows a "Show more / Show less" toggle once the
 *   content overflows the 3-line clamp (detail page).
 * - Renders an "AI translated" disclaimer when `aiTranslated` is set, to
 *   manage expectations about translation quality. This used to be inferred
 *   from the locale alone, which no longer works: the catalog is English-
 *   first, so `en` is never translated and `vi` usually isn't either — only
 *   the long tail without an official Vietnamese synopsis is.
 */
export default function MovieSummary({
  summary,
  expandable = false,
  aiTranslated = false,
}: MovieSummaryProps) {
  const t = useTranslations('movie.summary');
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    if (contentRef.current) contentRef.current.textContent = summary;
    setIsExpanded(false);
  }, [summary]);

  useEffect(() => {
    if (!expandable || !contentRef.current) return;
    const el = contentRef.current;
    setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [summary, expandable]);

  const showAiBadge = aiTranslated && summary.trim().length > 0;

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
