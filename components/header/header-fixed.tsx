import logo from '../../public/logo.png';
import Image from 'next/image';
import { IoSearch } from 'react-icons/io5';
import SubType from './sub-type';
import SubCountries from './sub-countries';
import LoginSignUpIcon from '../auth/login-signup-icon';
import { useSelector } from 'react-redux';
import AccountProfileIcon from '../account/account-profile-icon';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function HeaderFixed({ isScrolled }: { isScrolled: boolean }) {
  const user = useSelector((state: any) => state.auth.user);
  const [authenticatedUser, setAuthenticatedUser] = useState<object | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const pathname = usePathname()

  useEffect(() => {
    setAuthenticatedUser(user);
    setLoading(false);
  }, [user]);
  
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
            <a className={`hover:text-custome-red ${pathname === '/movies/format/phim-le' && 'text-custome-red'}`} href="/movies/format/phim-le">
              Phim lẻ
            </a>
          </li>
          <li className="px-8">
            <a className={`hover:text-custome-red ${pathname === '/movies/format/phim-bo' && 'text-custome-red'}`} href="/movies/format/phim-bo">
              Phim bộ
            </a>
          </li>
          <li className="px-8">
            <a className={`hover:text-custome-red ${pathname === '/movies/format/hoat-hinh' && 'text-custome-red'}`} href="/movies/format/hoat-hinh">
              Hoạt hình
            </a>
          </li>
          <li className="px-8">
            <a className={`hover:text-custome-red ${pathname === '/movies/format/tv-shows' && 'text-custome-red'}`} href="/movies/format/tv-shows">
              TV show
            </a>
          </li>
          <li className={`px-8 relative ${isScrolled && 'group'}`}>
            <p className="leading-[3.62rem] cursor-pointer">Thể loại</p>
            <SubType />
          </li>
          <li className={`px-8 relative ${isScrolled && 'group'}`}>
            <p className="leading-[3.62rem] hover:text-custome-red cursor-pointer">Quốc gia</p>
            <SubCountries />
          </li>
        </ul>
        <div className="flex gap-x-4 items-center h-[3.62rem]">
          <a className="cursor-pointer hover:text-custome-red" href="/search">
            <IoSearch size={25} />
          </a>
          <div className={`relative h-full flex items-center pl-6 ${isScrolled && 'group'}`}>
          {!loading && (authenticatedUser ? <AccountProfileIcon authenticatedUser={authenticatedUser} /> : <LoginSignUpIcon isScrolled={isScrolled} />)}
          </div>
        </div>
      </div>
    </header>
  );
}
