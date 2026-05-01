import HomePage from '@/components/home';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from 'i18n/routing';

interface OPhimSeoOnPage {
  titleHead?: string;
  descriptionHead?: string;
  og_type?: string;
  og_image?: string[];
}

/**
 * Build dynamic metadata for the home page.
 *
 * - For Vietnamese locale: prefer OPhim's `seoOnPage` block (already in VI).
 * - For other locales: fall back to translated strings from `messages/<locale>.json`
 *   (OPhim doesn't provide SEO content in other languages).
 * - Adds `<link rel="alternate" hreflang>` so Google indexes both locales.
 * - ISR revalidates hourly to keep content fresh.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  const fallbackTitle = t('homeTitle');
  const fallbackDescription = t('homeDescription');

  // Hreflang alternates for SEO
  const alternates = {
    canonical: `/${locale}`,
    languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])),
  };

  let title = fallbackTitle;
  let description = fallbackDescription;
  let ogImages: string[] = [];

  // Only call OPhim for VI — its seoOnPage is Vietnamese-only.
  // For EN, stick with our locally-translated strings.
  if (locale === 'vi') {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_DOMAIN}/v1/api/home`, {
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const json = await res.json();
        const seo: OPhimSeoOnPage | undefined = json?.data?.seoOnPage;
        const cdn: string | undefined = json?.data?.APP_DOMAIN_CDN_IMAGE;

        if (seo?.titleHead) title = seo.titleHead;
        if (seo?.descriptionHead) description = seo.descriptionHead;

        if (seo?.og_image && cdn) {
          ogImages = seo.og_image
            .slice(0, 4)
            .map((path) => (path.startsWith('http') ? path : `${cdn}${path}`));
        }
      }
    } catch {
      // Fall through to fallback strings
    }
  }

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      type: 'website',
      locale,
      images: ogImages.length > 0 ? ogImages : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImages.length > 0 ? ogImages : undefined,
    },
  };
}

export default function Home() {
  return <HomePage />;
}
