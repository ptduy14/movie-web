import { MdNewReleases } from 'react-icons/md';

interface DailyUpdateBannerProps {
  count?: number;
  totalLibrary?: number;
}

/**
 * Slim ticker banner shown between the hero swiper and movie lists.
 * Hidden when no fresh updates are reported by the API.
 */
export default function DailyUpdateBanner({ count, totalLibrary }: DailyUpdateBannerProps) {
  if (!count || count <= 0) return null;

  return (
    <div className="container-wrapper">
      <div className="mt-6 mb-6 mx-4 md:mx-0 flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-red-600/20 via-red-500/10 to-transparent border-l-4 border-red-500">
        <MdNewReleases className="text-red-500 text-2xl flex-shrink-0 animate-pulse" />
        <div className="text-sm md:text-base">
          <span className="font-semibold text-white">Hôm nay có </span>
          <span className="font-bold text-red-400">{count}</span>
          <span className="font-semibold text-white"> phim mới vừa lên sóng 🔥</span>
          {/* {totalLibrary && totalLibrary > 0 && (
            <span className="text-white/60 ml-2">
              · Thư viện: {totalLibrary.toLocaleString('vi-VN')} phim
            </span>
          )} */}
        </div>
      </div>
    </div>
  );
}
