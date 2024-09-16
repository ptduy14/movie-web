import logo from '../../public/logo.png';
import Image from 'next/image';
import { IoSearch } from 'react-icons/io5';
import SubType from './sub-type';

export default function HeaderFixed({ isScrolled }: { isScrolled: boolean }) {
  return (
    <header
      className={`fixed left-0 right-0 z-20 bg-black transition-all duration-500 ${
        isScrolled ? 'top-0' : 'top-[-70px]'
      }`}
    >
      <div className="header-container flex items-center justify-between container-wrapper">
        <a className="block" href="/">
          <Image src={logo} alt="Picture of the author" className="w-32" />
        </a>
        <ul className="flex items-center font-semibold">
          <li className="px-9">
            <a href="/movies/format/phim-le">Phim lẻ</a>
          </li>
          <li className="px-9">
            <a href="/movies/format/phim-bo">Phim bộ</a>
          </li>
          <li className="px-9">
            <a href="/movies/format/hoat-hinh">Hoạt hình</a>
          </li>
          <li className="px-9">
            <a href="/movies/format/tv-shows">TV show</a>
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
