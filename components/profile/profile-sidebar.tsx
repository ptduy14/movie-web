'use client';

import { ProfileSection } from './index';
import { IoPerson, IoShieldCheckmark, IoLanguage, IoHelpCircle, IoLogOut } from 'react-icons/io5';
import { useDispatch } from 'react-redux';
import { removeUser } from '../../redux/slices/user-slice';
import AuthServices from 'services/auth-services';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useState } from 'react';
import LoadingSpinerBtn from '../loading/loading-spiner-btn';
import { toast } from 'react-toastify';

interface ProfileSidebarProps {
  activeSection: ProfileSection;
  onSectionChange: (section: ProfileSection) => void;
  user: any;
}

const menuItems = [
  {
    id: 'personal' as ProfileSection,
    label: 'Thông tin cá nhân',
    icon: IoPerson,
  },
  {
    id: 'security' as ProfileSection,
    label: 'Bảo mật',
    icon: IoShieldCheckmark,
  },
  {
    id: 'language' as ProfileSection,
    label: 'Ngôn ngữ',
    icon: IoLanguage,
  },
  {
    id: 'support' as ProfileSection,
    label: 'Hỗ trợ',
    icon: IoHelpCircle,
  },
];

export default function ProfileSidebar({
  activeSection,
  onSectionChange,
  user,
}: ProfileSidebarProps) {
  const dispatch = useDispatch();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await AuthServices.removeAuthCookie();
      await signOut(auth);
      dispatch(removeUser());
      toast.success('Đăng xuất thành công');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi đăng xuất');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="bg-black/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 lg:p-6">
      {/* User Info */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            {user.photo ? (
              <img src={user.photo} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <span className="text-white font-semibold text-lg">
                {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{user.name || 'User'}</p>
            <p className="text-gray-400 text-xs truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="space-y-2 mb-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
                isActive
                  ? 'bg-custome-red text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="border-t border-gray-700 pt-4">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center space-x-3 px-3 py-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
        >
          <IoLogOut size={18} />
          <span className="text-sm font-medium">
            {isLoggingOut ? <LoadingSpinerBtn /> : 'Đăng xuất'}
          </span>
        </button>
      </div>
    </div>
  );
}
