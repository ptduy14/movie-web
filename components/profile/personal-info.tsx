'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/slices/user-slice';
import { toast } from 'react-toastify';
import LoadingSpinerBtn from '../loading/loading-spiner-btn';
import { IoCamera, IoCheckmark, IoClose } from 'react-icons/io5';

interface PersonalInfoProps {
  user: any;
}

interface FormData {
  name: string;
  email: string;
}

export default function PersonalInfo({ user }: PersonalInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      name: user.name || '',
      email: user.email || '',
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
    reset({
      name: user.name || '',
      email: user.email || '',
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarPreview(null);
    reset({
      name: user.name || '',
      email: user.email || '',
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const userRef = doc(db, 'Users', user.id);
      const updateData: any = {
        name: data.name,
        email: data.email,
      };

      // If avatar was changed, you would upload it here
      // For now, we'll just update the text fields

      await updateDoc(userRef, updateData);

      // Update Redux state
      const updatedUser = {
        ...user,
        ...updateData,
      };
      dispatch(setUser(updatedUser));

      toast.success('Cập nhật thông tin thành công');
      setIsEditing(false);
      setAvatarPreview(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Thông tin cá nhân</h2>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-custome-red text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Chỉnh sửa
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                />
              ) : user.photo ? (
                <img src={user.photo} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-semibold text-2xl">
                  {user.name?.charAt(0)?.toUpperCase() ||
                    user.email?.charAt(0)?.toUpperCase() ||
                    'U'}
                </span>
              )}
            </div>
            {isEditing && (
              <label className="absolute -bottom-1 -right-1 bg-custome-red text-white p-1 rounded-full cursor-pointer hover:bg-red-700 transition-colors">
                <IoCamera size={12} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <div>
            <h3 className="text-white font-medium">Ảnh đại diện</h3>
            <p className="text-gray-400 text-sm">JPG, PNG hoặc GIF. Tối đa 2MB.</p>
          </div>
        </div>

        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-gray-300 mb-2">
            Tên hiển thị
          </label>
          {isEditing ? (
            <input
              type="text"
              id="name"
              className={`w-full p-3 border ${
                errors.name ? 'border-red-500' : 'border-gray-600'
              } bg-black text-white focus:outline-none focus:ring-2 ${
                errors.name ? 'focus:ring-red-500' : 'focus:ring-custome-red'
              } rounded-lg`}
              {...register('name', {
                required: 'Tên hiển thị là bắt buộc',
                minLength: {
                  value: 2,
                  message: 'Tên phải có ít nhất 2 ký tự',
                },
              })}
            />
          ) : (
            <div className="p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white">
              {user.name || 'Chưa cập nhật'}
            </div>
          )}
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-gray-300 mb-2">
            Email
          </label>
          {isEditing ? (
            <input
              type="email"
              id="email"
              className={`w-full p-3 border ${
                errors.email ? 'border-red-500' : 'border-gray-600'
              } bg-black text-white focus:outline-none focus:ring-2 ${
                errors.email ? 'focus:ring-red-500' : 'focus:ring-custome-red'
              } rounded-lg`}
              {...register('email', {
                required: 'Email là bắt buộc',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email không hợp lệ',
                },
              })}
            />
          ) : (
            <div className="p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white">
              {user.email}
            </div>
          )}
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        {/* Account Info */}
        <div className="border-t border-gray-700 pt-6">
          <h3 className="text-white font-medium mb-4">Thông tin tài khoản</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">ID tài khoản</label>
              <div className="p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-gray-300 text-sm font-mono">
                {user.id}
              </div>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Ngày tạo</label>
              <div className="p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-gray-300 text-sm">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                  : 'Không xác định'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex items-center space-x-3 pt-6 border-t border-gray-700">
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
                  <span>Lưu thay đổi</span>
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
        )}
      </form>
    </div>
  );
}
