import HomePage from '@/components/home';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title:
    'MovieX - Xem Phim Online | Phim Lẻ | TV Show | Phim Bộ | Hoạt Hình | Vietsub | Lồng Tiếng Cập Nhật Liên Tục',
  description:
    'Xem phim online với hàng nghìn phim lẻ, TV show, phim bộ thuộc nhiều thể loại hấp dẫn, đã được lồng tiếng và cập nhật mới nhất mỗi ngày. Trải nghiệm xem phim chất lượng cao hoàn toàn miễn phí tại MovieX.',
};

export default function Home() {
  return <HomePage />
}
