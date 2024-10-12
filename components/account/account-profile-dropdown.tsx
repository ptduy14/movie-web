'use client';

import { useDispatch, useSelector } from 'react-redux';
import { removeUser } from '../../redux/slices/user-slice';
import AuthServices from 'services/auth-services';

export default function AccountProfileDropdown() {
  const user = useSelector((state: any) => state.account.user);
  const dispatch = useDispatch();

  const handleLogout = async () => {
    await AuthServices.logout();
    dispatch(removeUser());
  };

  return (
    <div className="group-hover:block hidden border border-slate-600 absolute bg-black right-0 top-[3.625rem] min-w-[12rem] px-4 py-4 space-y-5">
      <div className="border-b border-gray-500 pb-2 mb-2">
        <span className="text-white text-lg">{user.email}</span>
        <br />
        <span className="text-gray-400 text-sm">{user.name}</span>
      </div>
      <div
        onClick={handleLogout}
        className="bg-[#e20913] text-center block px-8 py-1 rounded-sm cursor-pointer hover:opacity-90 text-white font-semibold"
      >
        Đăng xuất
      </div>
    </div>
  );
}
