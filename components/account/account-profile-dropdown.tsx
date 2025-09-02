'use client';

import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { removeUser } from '../../redux/slices/user-slice';
import AuthServices from 'services/auth-services';
import LoadingSpinerBtn from '../loading/loading-spiner-btn';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import Link from 'next/link';
import { useDropdown } from '../context/dropdown-context';
import { IoBookmark, IoTime, IoPerson, IoLogOut } from 'react-icons/io5';

export default function AccountProfileDropdown({ authenticatedUser }: { authenticatedUser: any }) {
  const { setAccountDropdownState } = useDropdown();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const accountDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setIsLoading(true);
    await AuthServices.removeAuthCookie();
    await signOut(auth);
    dispatch(removeUser());
    setIsLoading(false);
  };

  useEffect(() => {
    const detectCloseAccountDropdown = (e: MouseEvent) => {
      if (
        accountDropdownRef.current !== null &&
        !accountDropdownRef.current.contains(e.target as Node)
      ) {
        setAccountDropdownState({
          isOpenInHeaderDefault: false,
          isOpenInHeaderFixed: false,
        });
      }
    };

    document.addEventListener('click', detectCloseAccountDropdown);

    return () => document.removeEventListener('click', detectCloseAccountDropdown);
  }, [setAccountDropdownState]);

  return (
    <div
      ref={accountDropdownRef}
      className="absolute bg-black/95 backdrop-blur-sm border border-gray-700 right-0 top-[3.625rem] min-w-[16rem] max-w-[20rem] rounded-xl shadow-2xl overflow-hidden z-50"
    >
      {/* User Info Header */}
      <div className="px-4 py-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-b border-gray-600">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {authenticatedUser.name?.charAt(0)?.toUpperCase() ||
                authenticatedUser.email?.charAt(0)?.toUpperCase() ||
                'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {authenticatedUser.name || 'User'}
            </p>
            <p className="text-gray-400 text-xs truncate">{authenticatedUser.email}</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-2">
        {/* Collection Link */}
        <Link
          href="/movies/collection"
          className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
          onClick={() =>
            setAccountDropdownState({
              isOpenInHeaderDefault: false,
              isOpenInHeaderFixed: false,
            })
          }
        >
          <IoBookmark size={18} />
          <span className="text-sm font-medium">Bộ sưu tập</span>
        </Link>

        {/* Recent Movies Link */}
        <Link
          href="/movies/recent"
          className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
          onClick={() =>
            setAccountDropdownState({
              isOpenInHeaderDefault: false,
              isOpenInHeaderFixed: false,
            })
          }
        >
          <IoTime size={18} />
          <span className="text-sm font-medium">Phim xem gần đây</span>
        </Link>

        {/* Profile Link */}
        <Link
          href="/profile"
          className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
          onClick={() =>
            setAccountDropdownState({
              isOpenInHeaderDefault: false,
              isOpenInHeaderFixed: false,
            })
          }
        >
          <IoPerson size={18} />
          <span className="text-sm font-medium">Thông tin cá nhân</span>
        </Link>

        {/* Divider */}
        <div className="border-t border-gray-700 my-2"></div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="flex items-center space-x-3 px-4 py-3 w-full text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors disabled:opacity-50"
        >
          <IoLogOut size={18} />
          <span className="text-sm font-medium">
            {isLoading ? <LoadingSpinerBtn /> : 'Đăng xuất'}
          </span>
        </button>
      </div>
    </div>
  );
}
