"use client"

import Link from "next/link"
import { FaGithub } from "react-icons/fa";

export default function Footer() {

  return (
    <footer className="w-full bg-black text-gray-300 relative">
      {/* Gradient top border */}
      <div className="h-1 w-full bg-gradient-to-r from-red-700 via-red-600 to-red-700"></div>

      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
          {/* Left Column - About MOVIEX */}
          <div className="space-y-5">
            <Link href="/" className="inline-block">
              <h2 className="text-4xl font-bold text-red-600 tracking-tight">MOVIEX</h2>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              MovieX - Trang xem phim online chất lượng cao miễn phí Vietsub, thuyết minh, lồng tiếng Full HD. Kho phim
              mới không lỗ, phim chiếu rạp, phim bộ, phim lẻ từ nhiều quốc gia như Việt Nam, Hàn Quốc, Trung Quốc, Thái
              Lan, Nhật Bản, Âu Mỹ... đã đang thể loại. Khám phá nền tảng phim trực tuyến hay nhất 2024 chất lượng 4K!
            </p>

            <div className="flex items-center space-x-4 pt-2">
              <Link
                href="/"
                className="bg-gray-900 hover:bg-red-600 text-white p-2 rounded-full transition-colors duration-300"
                aria-label="Facebook"
              >
                <FaGithub size={24}/>
              </Link>
            </div>
          </div>

          {/* Middle Column - Information */}
          <div className="space-y-5">
            <h3 className="text-xl font-bold text-white mb-4 relative pl-3 border-l-4 border-red-600">Thông tin</h3>
            <ul className="space-y-3 grid grid-cols-1 gap-2">
              {["Hỏi đáp", "Chính sách bảo mật", "Điều khoản sử dụng", "Giới thiệu", "Liên hệ"].map((item, index) => (
                <li key={index}>
                  <Link
                    href="/"
                    className="text-sm text-gray-400 hover:text-red-500 transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-1 h-1 bg-red-600 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column - Movie Categories */}
          <div className="space-y-5">
            <h3 className="text-xl font-bold text-white mb-4 relative pl-3 border-l-4 border-red-600">Danh mục phim</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <ul className="space-y-3">
                  {["Phim Lẻ", "Phim Bộ", "Phim Chiếu Rạp", "Anime", "Phim Hoạt Hình"].map((item, index) => (
                    <li key={index}>
                      <Link
                        href="/"
                        className="text-sm text-gray-400 hover:text-red-500 transition-colors duration-300 flex items-center group"
                      >
                        <span className="w-1 h-1 bg-red-600 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <ul className="space-y-3">
                  {["Phim Hành Động", "Phim Tình Cảm", "Phim Kinh Dị", "Phim Viễn Tưởng", "Phim Mới"].map(
                    (item, index) => (
                      <li key={index}>
                        <Link
                          href="/"
                          className="text-sm text-gray-400 hover:text-red-500 transition-colors duration-300 flex items-center group"
                        >
                          <span className="w-1 h-1 bg-red-600 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                          {item}
                        </Link>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Section with gradient border */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-500">© 2024 MOVIEX. Tất cả các quyền được bảo lưu.</p>
          <p className="mt-2 text-xs text-gray-600">
            MOVIEX không lưu trữ bất kỳ nội dung nào trên trang web này. Tất cả nội dung đều được lấy từ các nguồn bên
            thứ ba.
          </p>
          <p className="mt-2 text-xs text-gray-600">
            Xem phim online chất lượng cao tại MOVIEX - Trang web xem phim trực tuyến hàng đầu Việt Nam
          </p>
        </div>
      </div>
    </footer>
  )
}
