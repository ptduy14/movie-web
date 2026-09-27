'use client';
import { useLocale } from 'next-intl';
import { localizedLang } from 'constants/i18n-mappings';
import type { Locale } from 'i18n/routing';

interface QualityLangBadgeProps {
  quality?: string;
  lang?: string;
}

/**
 * Top-right corner badge: combines lang + quality into a single chip.
 *
 * `lang` is always "Phụ đề" for catalog items — the playback provider serves
 * original audio with subtitles, never a Vietnamese dub. The older Vietsub /
 * Thuyết Minh forms still appear in watch history written before the
 * migration, so LANG_MAP keeps handling them.
 *
 * Quality is universal (HD/Full HD/4K) — no localization.
 */
export default function QualityLangBadge({ quality, lang }: QualityLangBadgeProps) {
  const locale = useLocale() as Locale;
  if (!quality && !lang) return null;

  let shortLang = lang ? localizedLang(lang, locale) : '';
  // Compact common variants to keep the chip narrow
  shortLang = shortLang
    .replace(/Vietsub \+ Thuyết Minh/i, 'Vsub+TM')
    .replace(/Vietsub \+ Lồng Tiếng/i, 'Vsub+LT')
    .replace(/Thuyết Minh/i, 'TM')
    .replace(/Lồng Tiếng/i, 'LT')
    .replace(/Vietsub/i, 'Vsub')
    .replace(/Sub \+ Voiceover/i, 'Sub+VO')
    .replace(/Sub \+ Dubbed/i, 'Sub+Dub')
    .replace(/Voiceover/i, 'VO');

  const label = [shortLang, quality].filter(Boolean).join(' · ');

  return (
    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-custome-red text-white rounded">
      {label}
    </span>
  );
}
