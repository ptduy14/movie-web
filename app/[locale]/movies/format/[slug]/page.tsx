import type { Metadata } from 'next';
import { browseMetadata } from 'lib/browse-metadata';
import MovieFormatPage from "@/components/movie-format"
import { notFound } from 'next/navigation';
import { isKnownFormat } from 'constants/catalog-taxonomy';

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  return browseMetadata('format', params.slug, params.locale);
}

export default function MovieFormat({ params }: { params: { slug: string } }) {
  if (!isKnownFormat(params.slug)) notFound();
  return <MovieFormatPage slug={params.slug} />;
}