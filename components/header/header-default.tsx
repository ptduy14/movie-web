import logo from '../../public/logo.png';
import Image from 'next/image';
import { IoSearch } from 'react-icons/io5';
import SubType from './sub-type';
import SubCountries from './sub-countries';
import LoginSignUpIcon from '../auth/login-signup-icon';
import { useSelector } from 'react-redux';
import AccountProfileIcon from '../account/account-profile-icon';
import { useEffect, useState } from 'react';

export default function HeaderDefault({ isScrolled }: { isScrolled: boolean }) {
  const user = useSelector((state: any) => state.account.user);
  const [isShowingAccountProfileIcon, setIsShowingAccountProfileIcon] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user) {
      setIsShowingAccountProfileIcon(true)
    } else {
      setIsShowingAccountProfileIcon(false);
    }
    setLoading(false);
  }, [user])

  return (
    <header className="absolute top-0 left-0 right-0 z-10">
      <div className="header-container flex items-center justify-between container-wrapper">
        <a className="block" href="/">
          <Image src={logo} alt="Picture of the author" className="w-32" />
        </a>
        <ul className="flex items-center font-semibold text-lg">
          <li className="px-8">
            <a className="leading-[3.62rem] hover:text-[#e10711]" href="/movies/format/phim-le">
              Phim lẻ
            </a>
          </li>
          <li className="px-8">
            <a className="leading-[3.62rem] hover:text-[#e10711]" href="/movies/format/phim-bo">
              Phim bộ
            </a>
          </li>
          <li className="px-8">
            <a className="leading-[3.62rem] hover:text-[#e10711]" href="/movies/format/hoat-hinh">
              Hoạt hình
            </a>
          </li>
          <li className="px-8">
            <a className="leading-[3.62rem] hover:text-[#e10711]" href="/movies/format/tv-shows">
              TV show
            </a>
          </li>
          <li className={`px-8 relative ${!isScrolled && 'group'}`}>
            <p className="leading-[3.62rem] hover:text-[#e10711] cursor-pointer">Thể loại</p>
            <SubType />
          </li>
          <li className={`px-8 relative ${!isScrolled && 'group'}`}>
            <p className="leading-[3.62rem] hover:text-[#e10711] cursor-pointer">Quốc gia</p>
            <SubCountries />
          </li>
        </ul>
        <div className="flex gap-x-4 items-center h-[3.62rem]">
          <a className="cursor-pointer hover:text-[#e10711]" href="/search">
            <IoSearch size={25} />
          </a>
          <div className={`relative h-full flex items-center pl-6 ${!isScrolled && 'group'}`}>
          {!loading && (isShowingAccountProfileIcon ? <AccountProfileIcon /> : <LoginSignUpIcon isScrolled={isScrolled} />)}
          </div>
        </div>
      </div>
    </header>
  );
}
