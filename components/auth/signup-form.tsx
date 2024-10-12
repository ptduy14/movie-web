import React, { SetStateAction } from 'react';

export default function SignUpForm({
  setRenderSignUpForm,
}: {
  setRenderSignUpForm: React.Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <>
      <h2 className="text-center text-white text-lg font-semibold mb-6">Đăng ký khoản MovieX</h2>
      {/* Form */}
      <form>
        {/* Name Input */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-300 mb-1">
            Name:
          </label>
          <input
            type="name"
            id="name"
            className="w-full p-2 border border-slate-600 bg-black text-white focus:outline-none focus:ring-2 focus:ring-[#e20913] rounded"
            required
          />
        </div>
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
            // onClick={handleLoginByCredential}
          >
            Đăng nhập
          </button>
        </div>
      </form>
      {/* Google Login Option */}
      <button
        type="button"
        className="bg-gray-800 text-white rounded p-2 w-full hover:bg-gray-700 transition duration-200"
      >
        Đăng ký bằng Google
      </button>
      <div className="text-center mt-6">
        Bạn đã có tài khoản?{' '}
        <span className="underline text-[#e20913] font-bold cursor-pointer" onClick={() => setRenderSignUpForm(false)}>Đăng Nhập</span>
      </div>
    </>
  );
}
