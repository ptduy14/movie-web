import logo from "../../public/logo.png";
import Image from "next/image";
import { IoSearch } from "react-icons/io5";

export default function HeaderFixed({ isScrolled } : { isScrolled: boolean }) {
  return (
    <header className={`py-4 fixed left-0 right-0 z-10 bg-black transition-all duration-500 ${isScrolled ? "top-0" : "top-[-70px]"}`}>
      <div className="header-container flex items-center justify-between container-wrapper">
        <a className="/">
          <Image src={logo} alt="Picture of the author" className="w-32" />
        </a>
        <ul className="flex items-center font-semibold">
          <li className="px-9">Phim lẻ</li>
          <li className="px-9">Phim bộ</li>
          <li className="px-9">Hoạt hình</li>
          <li className="px-9">TV show</li>
        </ul>
        <div className="cursor-pointer"><IoSearch size={20}/></div>
      </div>
    </header>
  );
}
