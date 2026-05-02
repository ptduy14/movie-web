import { Metadata } from 'next';
import MovieCollectionPage from '@/components/collection';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('collectionTitle'),
    description: t('collectionTitle'),
  };
}

export default function MoviesCollection() {
  return <MovieCollectionPage />;
}
