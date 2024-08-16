import logo from "../../public/logo.png";
import Image from "next/image";

export default function Header() {
  return (
    <header className="py-4 absolute top-0 left-0 right-0 z-10">
      <div className="header-container flex items-center justify-between container-wrapper">
        <div>
          <Image src={logo} alt="Picture of the author" className="w-32" />
        </div>
        <ul className="flex items-center font-semibold">
          <li className="px-9">Phim lẻ</li>
          <li className="px-9">Phim bộ</li>
          <li className="px-9">Hoạt hình</li>
          <li className="px-9">TV show</li>
        </ul>
        <div>tìm kiếm</div>
      </div>
    </header>
  );
}
