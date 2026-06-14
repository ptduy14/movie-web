'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import Image from 'next/image';
import PersonalInfo from './personal-info';
import SecuritySettings from './security-settings';
import LanguageSettings from './language-settings';
import SupportContact from './support-contact';
import { useTranslations } from 'next-intl';

export type ProfileSection = 'personal' | 'security' | 'language' | 'support';

export default function Profile() {
  const t = useTranslations('profile');
  const user = useSelector((state: RootState) => state.auth.user) as any;
  const [activeSection, setActiveSection] = useState<ProfileSection>('personal');

  if (!user) {
    return (
      <div className="pt-20 lg:pt-32 container-wrapper-movie h-full px-4 lg:px-0">
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <h2 className="text-white text-xl font-semibold mb-4">{t('loginRequired.title')}</h2>
            <p className="text-gray-400">{t('loginRequired.message')}</p>
          </div>
        </div>
      </div>
    );
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'personal':
        return <PersonalInfo user={user} />;
      case 'security':
        return <SecuritySettings user={user} />;
      case 'language':
        return <LanguageSettings />;
      case 'support':
        return <SupportContact />;
      default:
        return <PersonalInfo user={user} />;
    }
  };

  return (
    <div className="pt-20 lg:pt-32 container-wrapper-movie h-full px-4 lg:px-0">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">{t('page.title')}</h1>
          <p className="text-gray-400">{t('page.subtitle')}</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-black/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 lg:p-6">
              {/* User Info */}
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    {user.photo ? (
                      <Image
                        src={user.photo}
                        alt="Avatar"
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-lg">
                        {user.name?.charAt(0)?.toUpperCase() ||
                          user.email?.charAt(0)?.toUpperCase() ||
                          'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {user.name || 'User'}
                    </p>
                    <p className="text-gray-400 text-xs truncate">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items — horizontal scroll strip on mobile, vertical sidebar on lg */}
              <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:space-y-2 lg:overflow-visible lg:px-0 lg:pb-0">
                {[
                  { id: 'personal', label: t('menu.personalInfo') },
                  { id: 'security', label: t('menu.security') },
                  { id: 'language', label: t('menu.language') },
                  { id: 'support', label: t('menu.support') },
                ].map((item) => {
                  const isActive = activeSection === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id as ProfileSection)}
                      className={`flex min-h-[44px] flex-shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-4 text-sm font-medium transition-colors lg:w-full lg:justify-start ${
                        isActive
                          ? 'bg-custome-red text-white'
                          : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-black/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 lg:p-8">
              {renderActiveSection()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
