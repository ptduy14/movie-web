import RecentMoviePage from "@/components/recent";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title:
      'Phim xem gần đây',
    description:
      'Phim xem gần đây',
  };

export default function RecentMovies() {
    return <RecentMoviePage />
}