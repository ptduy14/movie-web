'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { toast } from 'react-toastify';
import LoadingSpinerBtn from '../loading/loading-spiner-btn';
import { IoShieldCheckmark, IoEye, IoEyeOff, IoCheckmark, IoClose } from 'react-icons/io5';

interface SecuritySettingsProps {
  user: any;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SecuritySettings({ user }: SecuritySettingsProps) {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<PasswordFormData>();

  const newPassword = watch('newPassword');

  const handleChangePassword = () => {
    setIsChangingPassword(true);
    reset();
  };

  const handleCancel = () => {
    setIsChangingPassword(false);
    reset();
    setShowPasswords({ current: false, new: false, confirm: false });
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const onSubmit = async (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    setIsLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Không tìm thấy người dùng');
      }

      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, data.newPassword);

      toast.success('Đổi mật khẩu thành công');
      setIsChangingPassword(false);
      reset();
      setShowPasswords({ current: false, new: false, confirm: false });
    } catch (error: any) {
      console.error('Error changing password:', error);

      let errorMessage = 'Có lỗi xảy ra khi đổi mật khẩu';
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Mật khẩu hiện tại không chính xác';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Mật khẩu mới quá yếu';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Vui lòng đăng nhập lại để thay đổi mật khẩu';
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Bảo mật tài khoản</h2>
        {!isChangingPassword && (
          <button
            onClick={handleChangePassword}
            className="px-4 py-2 bg-custome-red text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Đổi mật khẩu
          </button>
        )}
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800/30 border border-gray-600 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <IoShieldCheckmark className="text-green-400" size={20} />
            <h3 className="text-white font-medium">Mật khẩu</h3>
          </div>
          <p className="text-gray-400 text-sm">Mật khẩu của bạn đã được bảo mật</p>
        </div>

        <div className="bg-gray-800/30 border border-gray-600 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <IoShieldCheckmark className="text-green-400" size={20} />
            <h3 className="text-white font-medium">Xác thực 2 lớp</h3>
          </div>
          <p className="text-gray-400 text-sm">Chưa được kích hoạt</p>
        </div>
      </div>

      {/* Change Password Form */}
      {isChangingPassword && (
        <div className="border-t border-gray-700 pt-6">
          <h3 className="text-white font-medium mb-4">Thay đổi mật khẩu</h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="block text-gray-300 mb-2">
                Mật khẩu hiện tại
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  id="currentPassword"
                  className={`w-full p-3 pr-12 border ${
                    errors.currentPassword ? 'border-red-500' : 'border-gray-600'
                  } bg-black text-white focus:outline-none focus:ring-2 ${
                    errors.currentPassword ? 'focus:ring-red-500' : 'focus:ring-custome-red'
                  } rounded-lg`}
                  {...register('currentPassword', {
                    required: 'Mật khẩu hiện tại là bắt buộc',
                  })}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPasswords.current ? <IoEyeOff size={20} /> : <IoEye size={20} />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.currentPassword.message}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-gray-300 mb-2">
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  id="newPassword"
                  className={`w-full p-3 pr-12 border ${
                    errors.newPassword ? 'border-red-500' : 'border-gray-600'
                  } bg-black text-white focus:outline-none focus:ring-2 ${
                    errors.newPassword ? 'focus:ring-red-500' : 'focus:ring-custome-red'
                  } rounded-lg`}
                  {...register('newPassword', {
                    required: 'Mật khẩu mới là bắt buộc',
                    minLength: {
                      value: 6,
                      message: 'Mật khẩu phải có ít nhất 6 ký tự',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPasswords.new ? <IoEyeOff size={20} /> : <IoEye size={20} />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-gray-300 mb-2">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  id="confirmPassword"
                  className={`w-full p-3 pr-12 border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-600'
                  } bg-black text-white focus:outline-none focus:ring-2 ${
                    errors.confirmPassword ? 'focus:ring-red-500' : 'focus:ring-custome-red'
                  } rounded-lg`}
                  {...register('confirmPassword', {
                    required: 'Xác nhận mật khẩu là bắt buộc',
                    validate: (value) => value === newPassword || 'Mật khẩu xác nhận không khớp',
                  })}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPasswords.confirm ? <IoEyeOff size={20} /> : <IoEye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-800/30 border border-gray-600 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Yêu cầu mật khẩu:</h4>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Ít nhất 6 ký tự</li>
                <li>• Nên bao gồm chữ hoa, chữ thường và số</li>
                <li>• Tránh sử dụng thông tin cá nhân</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center space-x-2 px-6 py-3 bg-custome-red text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <LoadingSpinerBtn />
                ) : (
                  <>
                    <IoCheckmark size={16} />
                    <span>Đổi mật khẩu</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <IoClose size={16} />
                <span>Hủy</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tips */}
      <div className="border-t border-gray-700 pt-6 mt-8">
        <h3 className="text-white font-medium mb-4">Mẹo bảo mật</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-custome-red rounded-full mt-2"></div>
            <p className="text-gray-400 text-sm">Không chia sẻ mật khẩu với bất kỳ ai</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-custome-red rounded-full mt-2"></div>
            <p className="text-gray-400 text-sm">Đăng xuất khỏi các thiết bị công cộng</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-custome-red rounded-full mt-2"></div>
            <p className="text-gray-400 text-sm">Thay đổi mật khẩu định kỳ</p>
          </div>
        </div>
      </div>
    </div>
  );
}
