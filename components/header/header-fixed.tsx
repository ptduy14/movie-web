import logo from '../../public/logo.png';
import Image from 'next/image';
import { IoSearch } from 'react-icons/io5';
import SubType from './sub-type';
import SubCountries from './sub-countries';
import LoginSignUpIcon from '../auth/login-signup-icon';
import { useSelector } from 'react-redux';
import AccountProfileIcon from '../account/account-profile-icon';
import { useEffect, useState } from 'react';
import { usePathname } from 'i18n/routing';
import Notification from '../notification';
import { INotificationDropdownState } from 'types/notification';
import { Link } from 'i18n/routing';
import LanguageSwitcher from './language-switcher';
import { useTranslations } from 'next-intl';

export default function HeaderFixed({
  isShowFixedHeader,
  notificationDropdownState,
  setNotificationDropdownState,
}: {
  isShowFixedHeader: boolean;
  notificationDropdownState: INotificationDropdownState;
  setNotificationDropdownState: React.Dispatch<React.SetStateAction<INotificationDropdownState>>;
}) {
  const t = useTranslations('header.menu');
  const user = useSelector((state: any) => state.auth.user);
  const [authenticatedUser, setAuthenticatedUser] = useState<object | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const pathname = usePathname();

  useEffect(() => {
    setAuthenticatedUser(user);
    setLoading(false);
  }, [user]);

  return (
    <header
      className={`fixed left-0 right-0 z-20 bg-black transition-all duration-500 ${
        isShowFixedHeader ? 'top-0' : 'top-[-70px]'
      }`}
    >
      <div className="header-container flex items-center justify-between container-wrapper">
        <Link className="block" href="/">
          <Image src={logo} alt="Picture of the author" className="w-32" />
        </Link>
        <ul className="flex flex-grow justify-center items-center font-semibold text-lg">
          <li className="px-8">
            <Link
              className={`hover:text-custome-red ${
                pathname === '/movies/format/phim-le' && 'text-custome-red'
              }`}
              href="/movies/format/phim-le"
            >
              {t('singleMovies')}
            </Link>
          </li>
          <li className="px-8">
            <Link
              className={`hover:text-custome-red ${
                pathname === '/movies/format/phim-bo' && 'text-custome-red'
              }`}
              href="/movies/format/phim-bo"
            >
              {t('tvSeries')}
            </Link>
          </li>
          <li className="px-8">
            <Link
              className={`hover:text-custome-red ${
                pathname === '/movies/format/hoat-hinh' && 'text-custome-red'
              }`}
              href="/movies/format/hoat-hinh"
            >
              {t('cartoons')}
            </Link>
          </li>
          <li className="px-8">
            <Link
              className={`hover:text-custome-red ${
                pathname === '/movies/format/tv-shows' && 'text-custome-red'
              }`}
              href="/movies/format/tv-shows"
            >
              {t('tvShows')}
            </Link>
          </li>
          <li className={`px-8 relative ${isShowFixedHeader && 'group'}`}>
            <p className="leading-[3.62rem] cursor-pointer">{t('categories')}</p>
            <SubType />
          </li>
          <li className={`px-8 relative ${isShowFixedHeader && 'group'}`}>
            <p className="leading-[3.62rem] hover:text-custome-red cursor-pointer">{t('countries')}</p>
            <SubCountries />
          </li>
        </ul>
        <div className="flex gap-x-3 items-center justify-end min-w-[10rem] h-[3.62rem]">
          <LanguageSwitcher />
          <Link className="cursor-pointer hover:text-custome-red" href="/search">
            <IoSearch size={25} />
          </Link>
          {!loading &&
              (authenticatedUser ? (
                <AccountProfileIcon authenticatedUser={authenticatedUser} isOnFixedHeader={true} />
              ) : (
                <LoginSignUpIcon />
              ))}
          <div className={`relative h-full flex items-center`}>
            {!loading && authenticatedUser && (
              <Notification
                isOnFixedHeader={true}
                notificationDropdownState={notificationDropdownState}
                setNotificationDropdownState={setNotificationDropdownState}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
