'use client';
import { useEffect, useState } from 'react';
import Logo from '../../public/mini-logo.png';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { useAuthModel } from '../context/auth-modal-context';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuthModel();
  const [showAnimation, setShowAnimation] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthModalOpen) {
      setShowAnimation(true);
    } else {
      setShowAnimation(false);
    }
  }, [isAuthModalOpen]);

  const handleLoginByCredential = () => {
    toast.success('Tính năng này chưa thể hoàn thiện vui lòng đăng nhập bằng google');
  };

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50">
      <div
        onClick={() => closeAuthModal()}
        className="absolute inset-0 bg-gray-900 bg-opacity-50"
      ></div>
      <div
        className={`bg-black border border-slate-600 rounded-lg p-6 w-96 relative transition-transform duration-300 ${
          showAnimation ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
      >
        {/* Nút Close */}
        <button
          onClick={() => closeAuthModal()}
          className="absolute top-2 right-4 text-gray-300 hover:text-white"
        >
          &#x2715; {/* Dấu "x" để close */}
        </button>
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Image src={Logo} alt="Logo" className="w-16 h-16" />
        </div>
        <h2 className="text-center text-white text-lg font-semibold mb-6">
          Đăng nhập khoản MovieX
        </h2>
        {/* Form */}
        <form>
          {/* Email Input */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-300 mb-1">
              Email:
            </label>
            <input
              type="email"
              id="email"
              className="w-full p-2 border border-slate-600 bg-black text-white focus:outline-none focus:ring-2 focus:ring-[#e20913] rounded"
              required
            />
          </div>
          {/* Password Input */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-300 mb-1">
              Mật khẩu:
            </label>
            <input
              type="password"
              id="password"
              className="w-full p-2 border border-slate-600 bg-black text-white focus:outline-none focus:ring-2 focus:ring-[#e20913] rounded"
              required
            />
          </div>
          {/* Submit Button */}
          <div className="flex justify-center mb-4">
            <button
              type="submit"
              className="bg-[#e20913] text-white rounded p-2 w-full hover:bg-red-600 transition duration-200"
              onClick={handleLoginByCredential}
            >
              Đăng nhập
            </button>
          </div>
        </form>
        {/* Google Login Option */}
        <div className="flex justify-center">
          <button
            type="button"
            className="bg-gray-800 text-white rounded p-2 w-full hover:bg-gray-700 transition duration-200"
          >
            Đăng nhập bằng Google
          </button>
        </div>
      </div>
    </div>
  );
}
