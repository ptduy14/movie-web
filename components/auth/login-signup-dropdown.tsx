'use client';

import { useAuthModel } from '../context/auth-modal-context';

export default function LoginSignUpDropdown() {
  const { openAuthModal } = useAuthModel();
  return (
    <div className="group-hover:block hidden border border-slate-600 absolute bg-black right-0 top-[3.625rem] min-w-[21rem] px-4 py-4 text-center space-y-5">
      <div>Đăng nhập để cá nhân hóa trãi nghiệm xem phim</div>
      <div
        onClick={() => openAuthModal()}
        className="bg-[#e20913] inline-block px-8 py-1 rounded-sm cursor-pointer hover:opacity-90"
      >
        Đăng nhập
      </div>
    </div>
  );
}
