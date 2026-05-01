import HomePage from '@/components/home';
import { Metadata } from 'next';

const FALLBACK_TITLE =
  'MovieX - Xem Phim Online | Phim Lẻ | TV Show | Phim Bộ | Hoạt Hình | Vietsub | Lồng Tiếng Cập Nhật Liên Tục';
const FALLBACK_DESCRIPTION =
  'Xem phim online với hàng nghìn phim lẻ, TV show, phim bộ thuộc nhiều thể loại hấp dẫn, đã được lồng tiếng và cập nhật mới nhất mỗi ngày. Trải nghiệm xem phim chất lượng cao hoàn toàn miễn phí tại MovieX.';

interface OPhimSeoOnPage {
  titleHead?: string;
  descriptionHead?: string;
  og_type?: string;
  og_image?: string[];
}

/**
 * Build dynamic metadata from OPhim's `/v1/api/home` `seoOnPage` block.
 * - Revalidates every hour to keep SEO content fresh without hitting OPhim every request.
 * - Falls back to static strings on any fetch / parse failure.
 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_DOMAIN}/v1/api/home`, {
      next: { revalidate: 3600 }, // ISR: refresh hourly
    });

    if (!res.ok) throw new Error('Home metadata fetch failed');

    const json = await res.json();
    const seo: OPhimSeoOnPage | undefined = json?.data?.seoOnPage;
    const cdn: string | undefined = json?.data?.APP_DOMAIN_CDN_IMAGE;

    const title = seo?.titleHead || FALLBACK_TITLE;
    const description = seo?.descriptionHead || FALLBACK_DESCRIPTION;

    // og_image paths are relative — prepend CDN domain if available
    const ogImages =
      seo?.og_image && cdn
        ? seo.og_image
            .slice(0, 4) // cap to first 4 to avoid bloated head tags
            .map((path) => (path.startsWith('http') ? path : `${cdn}${path}`))
        : [];

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: (seo?.og_type as 'website') || 'website',
        images: ogImages.length > 0 ? ogImages : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ogImages.length > 0 ? ogImages : undefined,
      },
    };
  } catch {
    return {
      title: FALLBACK_TITLE,
      description: FALLBACK_DESCRIPTION,
    };
  }
}

export default function Home() {
  return <HomePage />;
}
