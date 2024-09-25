import SearchMoviePage from "@/components/search";

import { Metadata } from 'next';

export const metadata: Metadata = {
  title:
    'Tìm kiếm phim',
  description:
    'Tìm kiếm phim',
};

export default function SearchMovie() {
    return <SearchMoviePage />
}