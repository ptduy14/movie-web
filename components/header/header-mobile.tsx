'use client';
import React, { useState, useEffect } from 'react';
import logo from '../../public/logo.png';
import Image from 'next/image';
import { IoSearch, IoMenu, IoClose, IoChevronDown, IoChevronUp } from 'react-icons/io5';
import { Link } from 'i18n/routing';
import { usePathname } from 'i18n/routing';
import { useSelector } from 'react-redux';
import LoginSignUpIcon from '../auth/login-signup-icon';
import AccountProfileIcon from '../account/account-profile-icon';
import AccountProfileMobile from '../account/account-profile-mobile';
import Notification from '../notification';
import { INotificationDropdownState } from 'types/notification';
import movieType from '../../data/movie-type';
import countries from '../../data/countries';
import LanguageSwitcher from './language-switcher';
import { useTranslations, useLocale } from 'next-intl';
import { localizedCategory, localizedCountry } from 'constants/i18n-mappings';
import type { Locale } from 'i18n/routing';

export default function HeaderMobile({
  isShowFixedHeader,
  notificationDropdownState,
  setNotificationDropdownState,
}: {
  isShowFixedHeader: boolean;
  notificationDropdownState: INotificationDropdownState;
  setNotificationDropdownState: React.Dispatch<React.SetStateAction<INotificationDropdownState>>;
}) {
  const t = useTranslations('header.menu');
  const locale = useLocale() as Locale;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTypeSubmenuOpen, setIsTypeSubmenuOpen] = useState(false);
  const [isCountrySubmenuOpen, setIsCountrySubmenuOpen] = useState(false);
  const user = useSelector((state: any) => state.auth.user);
  const [authenticatedUser, setAuthenticatedUser] = useState<object | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const pathname = usePathname();

  // Set authenticated user
  useEffect(() => {
    setAuthenticatedUser(user);
    setLoading(false);
  }, [user]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsTypeSubmenuOpen(false);
    setIsCountrySubmenuOpen(false);
  };

  const toggleTypeSubmenu = () => {
    setIsTypeSubmenuOpen(!isTypeSubmenuOpen);
    setIsCountrySubmenuOpen(false); // Close country submenu when opening type
  };

  const toggleCountrySubmenu = () => {
    setIsCountrySubmenuOpen(!isCountrySubmenuOpen);
    setIsTypeSubmenuOpen(false); // Close type submenu when opening country
  };

  return (
    <>
      {/* Mobile Header */}
      <header
        className={`${
          isShowFixedHeader ? 'fixed' : 'absolute'
        } top-0 left-0 right-0 z-30 bg-black/90 backdrop-blur-sm`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Hamburger Menu Icon */}
          <button
            onClick={toggleMobileMenu}
            className="text-white hover:text-custome-red transition-colors"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <IoClose size={24} /> : <IoMenu size={24} />}
          </button>

          {/* Logo */}
          <Link className="block" href="/" onClick={closeMobileMenu}>
            <Image src={logo} alt="Movie Web Logo" className="w-24 h-auto" />
          </Link>

          {/* Right side actions: language + search */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              className="text-white hover:text-custome-red transition-colors"
              href="/search"
              aria-label="Search movies"
            >
              <IoSearch size={24} />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={closeMobileMenu}>
          <div
            className="fixed top-0 left-0 h-full w-80 bg-black/95 backdrop-blur-md transform transition-transform duration-300 ease-in-out"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <Image src={logo} alt="Movie Web Logo" className="w-20 h-auto" />
              <button
                onClick={closeMobileMenu}
                className="text-white hover:text-custome-red transition-colors"
              >
                <IoClose size={24} />
              </button>
            </div>

            {/* Menu Content */}
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-4 pb-16">
                {/* Navigation Links */}
                <nav className="mb-8">
                  <ul className="space-y-4">
                    <li>
                      <Link
                        className={`block py-2 text-lg font-medium transition-colors ${
                          pathname === '/movies/format/phim-le'
                            ? 'text-custome-red'
                            : 'text-white hover:text-custome-red'
                        }`}
                        href="/movies/format/phim-le"
                        onClick={closeMobileMenu}
                      >
                        {t('singleMovies')}
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={`block py-2 text-lg font-medium transition-colors ${
                          pathname === '/movies/format/phim-bo'
                            ? 'text-custome-red'
                            : 'text-white hover:text-custome-red'
                        }`}
                        href="/movies/format/phim-bo"
                        onClick={closeMobileMenu}
                      >
                        {t('tvSeries')}
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={`block py-2 text-lg font-medium transition-colors ${
                          pathname === '/movies/format/hoat-hinh'
                            ? 'text-custome-red'
                            : 'text-white hover:text-custome-red'
                        }`}
                        href="/movies/format/hoat-hinh"
                        onClick={closeMobileMenu}
                      >
                        {t('cartoons')}
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={`block py-2 text-lg font-medium transition-colors ${
                          pathname === '/movies/format/tv-shows'
                            ? 'text-custome-red'
                            : 'text-white hover:text-custome-red'
                        }`}
                        href="/movies/format/tv-shows"
                        onClick={closeMobileMenu}
                      >
                        {t('tvShows')}
                      </Link>
                    </li>
                    <li>
                      <button
                        className="flex items-center justify-between w-full py-2 text-lg font-medium text-white hover:text-custome-red transition-colors"
                        onClick={toggleTypeSubmenu}
                      >
                        {t('categories')}
                        {isTypeSubmenuOpen ? (
                          <IoChevronUp size={20} />
                        ) : (
                          <IoChevronDown size={20} />
                        )}
                      </button>
                      {isTypeSubmenuOpen && (
                        <ul className="ml-4 mt-2 space-y-2 border-l border-gray-700 pl-4">
                          {movieType.map((item) => (
                            <li key={item.slug}>
                              <Link
                                className={`block py-1 text-base transition-colors ${
                                  pathname === `/movies/type/${item.slug}`
                                    ? 'text-custome-red'
                                    : 'text-gray-300 hover:text-custome-red'
                                }`}
                                href={`/movies/type/${item.slug}`}
                                onClick={closeMobileMenu}
                              >
                                {localizedCategory(item.slug, locale)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                    <li>
                      <button
                        className="flex items-center justify-between w-full py-2 text-lg font-medium text-white hover:text-custome-red transition-colors"
                        onClick={toggleCountrySubmenu}
                      >
                        {t('countries')}
                        {isCountrySubmenuOpen ? (
                          <IoChevronUp size={20} />
                        ) : (
                          <IoChevronDown size={20} />
                        )}
                      </button>
                      {isCountrySubmenuOpen && (
                        <ul className="ml-4 mt-2 space-y-2 border-l border-gray-700 pl-4">
                          {countries.map((item) => (
                            <li key={item.slug}>
                              <Link
                                className={`block py-1 text-base transition-colors ${
                                  pathname === `/movies/country/${item.slug}`
                                    ? 'text-custome-red'
                                    : 'text-gray-300 hover:text-custome-red'
                                }`}
                                href={`/movies/country/${item.slug}`}
                                onClick={closeMobileMenu}
                              >
                                {localizedCountry(item.slug, locale)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  </ul>
                </nav>

                {/* User Section */}
                <div className="border-t border-gray-800 pt-4">
                  {!loading &&
                    (authenticatedUser ? (
                      <div className="space-y-4">
                        {/* Mobile Account Profile */}
                        <AccountProfileMobile
                          authenticatedUser={authenticatedUser}
                          onCloseMenu={closeMobileMenu}
                        />

                        {/* Notification */}
                        <Notification
                          isOnFixedHeader={false}
                          notificationDropdownState={notificationDropdownState}
                          setNotificationDropdownState={setNotificationDropdownState}
                          isMobile={true}
                          onCloseMenu={closeMobileMenu}
                        />
                      </div>
                    ) : (
                      <LoginSignUpIcon />
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
