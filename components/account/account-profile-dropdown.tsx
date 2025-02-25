'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { removeUser } from '../../redux/slices/user-slice';
import AuthServices from 'services/auth-services';
import LoadingSpinerBtn from '../loading/loading-spiner-btn';
import { signOut } from 'firebase/auth';
import { auth } from '../../configs/firebase';
import Link from 'next/link';

export default function AccountProfileDropdown({ authenticatedUser }: { authenticatedUser: any }) {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await AuthServices.removeAuthCookie();
    await signOut(auth);
    dispatch(removeUser());
    setIsLoading(false);
  };

  return (
    <div className="group-hover:block hidden border border-slate-600 absolute bg-black right-0 top-[3.625rem] min-w-[14rem] px-5 py-4 rounded-lg shadow-lg space-y-3">
      {/* Thông tin tài khoản */}
      <div className="border-b border-gray-500 pb-3 mb-3">
        <span className="text-white text-base block font-semibold">{authenticatedUser.email}</span>
        <span className="text-gray-400 text-sm block mt-1">{authenticatedUser.name}</span>
      </div>

      {/* Liên kết đến bộ sưu tập */}
      <div className="border-b border-gray-500 pb-3 mb-3">
        <Link
          className="block text-white text-base font-medium hover:text-gray-300 transition-colors"
          href="/movies/collection"
        >
          Bộ sưu tập
        </Link>
      </div>

      {/* Liên kết đến phim đã xem */}
      <div className="border-b border-gray-500 pb-3 mb-3">
        <Link
          className="block text-white text-base font-medium hover:text-gray-300 transition-colors"
          href="/movies/recent"
        >
          Phim xem gần đây
        </Link>
      </div>

      {/* Nút đăng xuất */}
      <button
        onClick={handleLogout}
        className="block w-full bg-[#e20913] text-center py-2 rounded-md cursor-pointer hover:opacity-90 transition-all text-white font-semibold"
        disabled={isLoading}
      >
        {isLoading ? <LoadingSpinerBtn /> : 'Đăng xuất'}
      </button>
    </div>
  );
}
