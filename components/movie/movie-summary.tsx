'use client';

import { useRef, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface MovieSummaryProps {
  summary: string;
  expandable?: boolean;
}

export default function MovieSummary({ summary, expandable = false }: MovieSummaryProps) {
  const t = useTranslations('movie.summary');
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

  if (!expandable) {
    return <div className="limit-movie-summary" ref={contentRef}></div>;
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
    </div>
  );
}
