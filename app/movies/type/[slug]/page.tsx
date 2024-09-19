import MovieTypePage from '@/components/move-type';

export default function MovieType({ params }: { params: { slug: string } }) {
  return <MovieTypePage slug={params.slug} />;
}
