interface QualityLangBadgeProps {
  quality?: string;
  lang?: string;
}

/**
 * Top-right corner badge: combines lang + quality into a single chip.
 * Falls back gracefully when one of the fields is missing.
 */
export default function QualityLangBadge({ quality, lang }: QualityLangBadgeProps) {
  if (!quality && !lang) return null;

  // Shorten common verbose lang strings for compact display
  const shortLang = lang
    ?.replace(/Vietsub \+ Thuyết Minh/i, 'Vsub+TM')
    .replace(/Thuyết Minh/i, 'TM')
    .replace(/Lồng Tiếng/i, 'LT')
    .replace(/Vietsub/i, 'Vsub');

  const label = [shortLang, quality].filter(Boolean).join(' · ');

  return (
    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-custome-red text-white rounded">
      {label}
    </span>
  );
}
