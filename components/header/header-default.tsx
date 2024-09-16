import logo from '../../public/logo.png';
import Image from 'next/image';
import { IoSearch } from 'react-icons/io5';
import SubType from './sub-type';

export default function HeaderDefault() {
  return (
    <header className="absolute top-0 left-0 right-0 z-10">
      <div className="header-container flex items-center justify-between container-wrapper">
        <a className="block" href="/">
          <Image src={logo} alt="Picture of the author" className="w-32" />
        </a>
        <ul className="flex items-center font-semibold">
          <li className="px-9">
            <a className="leading-[3.62rem]" href="/movies/format/phim-le">
              Phim lẻ
            </a>
          </li>
          <li className="px-9">
            <a className="leading-[3.62rem]" href="/movies/format/phim-bo">
              Phim bộ
            </a>
          </li>
          <li className="px-9">
            <a className="leading-[3.62rem]" href="/movies/format/hoat-hinh">
              Hoạt hình
            </a>
          </li>
          <li className="px-9">
            <a className="leading-[3.62rem]" href="/movies/format/tv-shows">
              TV show
            </a>
          </li>
          <li className="px-9 relative group">
            <p className="leading-[3.62rem] cursor-pointer">
              Thể loại
            </p>
            <SubType />
          </li>
        </ul>
        <a className="cursor-pointer" href="/search">
          <IoSearch size={20} />
        </a>
      </div>
    </header>
  );
}
