import { Metadata } from 'next';
import MovieCollectionPage from '@/components/collection';

export const metadata: Metadata = {
  title:
    'Bộ sưu tập phim',
  description:
    'Bộ sưu tập phim',
};

export default function MoviesCollection() {
    return <MovieCollectionPage />
}