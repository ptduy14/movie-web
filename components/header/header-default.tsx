import logo from "../../public/logo.png";
import Image from "next/image";
import { IoSearch } from "react-icons/io5";

export default function HeaderDefault() {
    return (
        <header className="py-4 absolute top-0 left-0 right-0 z-10">
          <div className="header-container flex items-center justify-between container-wrapper">
            <a className="block" href="/">
              <Image src={logo} alt="Picture of the author" className="w-32" />
            </a>
            <ul className="flex items-center font-semibold">
              <li className="px-9"><a href="/movies/type/phim-le">Phim lẻ</a></li>
              <li className="px-9"><a href="/movies/type/phim-bo">Phim bộ</a></li>
              <li className="px-9"><a href="/movies/type/hoat-hinh">Hoạt hình</a></li>
              <li className="px-9"><a href="/movies/type/tv-shows">TV show</a></li>
            </ul>
            <div className="cursor-pointer"><IoSearch size={20}/></div>
          </div>
        </header>
      );
}