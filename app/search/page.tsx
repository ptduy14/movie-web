import SearchMoviePage from "@/components/search";

import { Metadata } from 'next';

export const metadata: Metadata = {
  title:
    'Tìm kiếm phim',
  description:
    'Tìm kiếm phim',
};

export default function SearchMovie({searchParams}: {searchParams: {name?: string}}) {
  const movieName = searchParams.name || '';

  return <SearchMoviePage movieName={movieName}/>
}