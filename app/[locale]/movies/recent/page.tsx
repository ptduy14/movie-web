import RecentMoviePage from '@/components/recent';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('recentTitle'),
    description: t('recentTitle'),
  };
}

export default function RecentMovies() {
  return <RecentMoviePage />;
}
