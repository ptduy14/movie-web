import SearchMoviePage from '@/components/search';
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
    title: t('searchTitle'),
    description: t('searchTitle'),
  };
}

export default function SearchMovie({ searchParams }: { searchParams: { name?: string } }) {
  const movieName = searchParams.name || '';
  return <SearchMoviePage movieName={movieName} />;
}
