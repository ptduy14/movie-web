'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { removeUser } from '../../redux/slices/user-slice';
import AuthServices from 'services/auth-services';
import LoadingSpinerBtn from '../loading/loading-spiner-btn';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import Link from 'next/link';
import AccountDefaultImg from '../../public/account-default-img.jpg';
import Image from 'next/image';
import {
  IoChevronDown,
  IoChevronUp,
  IoPerson,
  IoBookmark,
  IoTime,
  IoLogOut,
} from 'react-icons/io5';

interface AccountProfileMobileProps {
  authenticatedUser: any;
  onCloseMenu: () => void;
}

export default function AccountProfileMobile({
  authenticatedUser,
  onCloseMenu,
}: AccountProfileMobileProps) {
  const dispatch = useDispatch();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await AuthServices.removeAuthCookie();
    await signOut(auth);
    dispatch(removeUser());
    setIsLoading(false);
    onCloseMenu(); // Close mobile menu after logout
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="pt-4">
      {/* User Profile Header */}
      <div
        className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 cursor-pointer hover:bg-gray-800/50 transition-colors"
        onClick={toggleExpanded}
      >
        <div className="flex items-center space-x-3">
          <Image
            src={authenticatedUser.photo || AccountDefaultImg}
            alt="User Profile"
            className="rounded-full border-2 border-gray-600"
            width={40}
            height={40}
          />
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">
              {authenticatedUser.name || 'User'}
            </p>
            <p className="text-gray-400 text-xs truncate">{authenticatedUser.email}</p>
          </div>
        </div>
        {isExpanded ? (
          <IoChevronUp className="text-gray-400" size={20} />
        ) : (
          <IoChevronDown className="text-gray-400" size={20} />
        )}
      </div>

      {/* Expanded Menu Items */}
      {isExpanded && (
        <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {/* Collection Link */}
          <Link
            href="/movies/collection"
            onClick={onCloseMenu}
            className="flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
          >
            <IoBookmark size={18} />
            <span className="text-sm font-medium">Bộ sưu tập</span>
          </Link>

          {/* Recent Movies Link */}
          <Link
            href="/movies/recent"
            onClick={onCloseMenu}
            className="flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
          >
            <IoTime size={18} />
            <span className="text-sm font-medium">Phim xem gần đây</span>
          </Link>

          {/* Profile Link */}
          <Link
            href="/profile"
            onClick={onCloseMenu}
            className="flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
          >
            <IoPerson size={18} />
            <span className="text-sm font-medium">Thông tin cá nhân</span>
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="flex items-center space-x-3 p-3 rounded-lg w-full text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors disabled:opacity-50"
          >
            <IoLogOut size={18} />
            <span className="text-sm font-medium">
              {isLoading ? <LoadingSpinerBtn /> : 'Đăng xuất'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
