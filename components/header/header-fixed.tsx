import logo from '../../public/logo.png';
import Image from 'next/image';
import { IoSearch } from 'react-icons/io5';
import SubType from './sub-type';
import SubCountries from './sub-countries';
import LoginSignUpIcon from '../auth/login-signup-icon';

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
        <ul className="flex items-center font-semibold text-lg">
          <li className="px-8">
            <a className="hover:text-[#e10711]" href="/movies/format/phim-le">
              Phim lẻ
            </a>
          </li>
          <li className="px-8">
            <a className="hover:text-[#e10711]" href="/movies/format/phim-bo">
              Phim bộ
            </a>
          </li>
          <li className="px-8">
            <a className="hover:text-[#e10711]" href="/movies/format/hoat-hinh">
              Hoạt hình
            </a>
          </li>
          <li className="px-8">
            <a className="hover:text-[#e10711]" href="/movies/format/tv-shows">
              TV show
            </a>
          </li>
          <li className={`px-8 relative ${isScrolled && 'group'}`}>
            <p className="leading-[3.62rem] cursor-pointer">Thể loại</p>
            <SubType />
          </li>
          <li className={`px-8 relative ${isScrolled && 'group'}`}>
            <p className="leading-[3.62rem] hover:text-[#e10711] cursor-pointer">Quốc gia</p>
            <SubCountries />
          </li>
        </ul>
        <div className="flex gap-x-4 items-center h-[3.62rem]">
          <a className="cursor-pointer hover:text-[#e10711]" href="/search">
            <IoSearch size={25} />
          </a>
          <div className={`relative h-full flex items-center pl-6 ${isScrolled && 'group'}`}>
            <LoginSignUpIcon isScrolled={isScrolled} />
          </div>
        </div>
      </div>
    </header>
  );
}
