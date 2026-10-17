import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { localizedCategory, localizedCountry, localizedFormat } from 'constants/i18n-mappings';
import type { Locale } from 'i18n/routing';

type BrowseKind = 'genre' | 'country' | 'format';

const LABEL: Record<BrowseKind, (slug: string, locale: Locale) => string> = {
  genre: localizedCategory,
  country: localizedCountry,
  format: localizedFormat,
};

/**
 * `<title>` and description for a browse page (genre / country / format),
 * in the page's own locale.
 *
 * The English site used to get Vietnamese titles, and every one said "2024"
 * — written once, never updated. The wording now lives in
 * `messages/*.json` under `metadata.browse`, one pattern per kind, because
 * Vietnamese and English don't build these phrases the same way ("Phim Hành
 * Động" vs "Action movies & series").
 */
export async function browseMetadata(
  kind: BrowseKind,
  slug: string,
  locale: string
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'metadata.browse' });
  const name = LABEL[kind](slug, locale as Locale);
  return {
    title: t(`${kind}Title`, { name }),
    description: t(`${kind}Description`, { name }),
  };
}
