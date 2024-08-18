import { FaPlay, FaPlus } from "react-icons/fa";

export default function HeroSection() {
  return (
    <div className="relative w-full h-[50rem]">
      <img
        src="https://phimimg.com/upload/vod/20240814-1/0de4eca8c326ebe368bda7072212bbc5.jpg"
        alt=""
        className="w-full h-full"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black to-50%"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black to-10%"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black to-10%"></div>
      <div className="absolute inset-0 bg-gradient-to-l from-black to-10%"></div>
      <div className="absolute w-2/4 top-[20rem] left-6 space-y-5">
        <h2 className="text-4xl font-bold">Phất Ngọc Yên</h2>
        <span className="block">
          Lý Quả Đóa bị đồng đội Đồ Linh Linh phản bội nên đã bỏ lỡ cơ hội được
          bước vào trường đại học thể thao mà cô hằng mơ ước. Vì để tiếp tục
          theo đuổi ước mơ, cô đã đến đại học Tân Cảng rồi trở thành đồng đội ăn
          ý nhất với Trần Úy Lam, người chuyển hướng từ bóng chuyền thông thường
          sang bóng chuyền bãi biển. Cả hai đã vượt qua chính mình, trở thành
          vận động viên bóng chuyền bãi biển xuất sắc, cùng nhau dũng cảm tiến
          về phía trước giữa những lời chúc phúc đến từ người thân, bạn bè và
          người yêu.
        </span>
        <div className="space-x-5 flex items-center">
          <a href="" className="inline-block py-3 px-5 bg-white text-black rounded-md">
            <div className="flex align-top space-x-2">
              <FaPlay size={18} />
              <span className="block leading-4 font-semibold">Xem phim</span>
            </div>
          </a>
          <button className="flex items-center space-x-2 bg-[#717171] py-3 px-5 rounded-md">
            <FaPlus size={18} />
            <span className="block leading-4 font-semibold">
              Danh sách phát
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
