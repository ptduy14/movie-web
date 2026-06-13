'use client';

import { Link, usePathname } from 'i18n/routing';
import { useSelector } from 'react-redux';
import { useTranslations } from 'next-intl';
import { useAuthModel } from '../context/auth-modal-context';
import {
  IoHome,
  IoHomeOutline,
  IoSearch,
  IoSearchOutline,
  IoBookmark,
  IoBookmarkOutline,
  IoPerson,
  IoPersonOutline,
} from 'react-icons/io5';
import type { IconType } from 'react-icons';

interface Tab {
  key: 'home' | 'search' | 'myList' | 'profile';
  href: string;
  requiresAuth: boolean;
  Icon: IconType;
  IconActive: IconType;
}

const TABS: Tab[] = [
  { key: 'home', href: '/', requiresAuth: false, Icon: IoHomeOutline, IconActive: IoHome },
  { key: 'search', href: '/search', requiresAuth: false, Icon: IoSearchOutline, IconActive: IoSearch },
  {
    key: 'myList',
    href: '/movies/collection',
    requiresAuth: true,
    Icon: IoBookmarkOutline,
    IconActive: IoBookmark,
  },
  { key: 'profile', href: '/profile', requiresAuth: true, Icon: IoPersonOutline, IconActive: IoPerson },
];

/**
 * Mobile-only bottom tab bar (the primary nav pattern of every major streaming
 * app). z-30 sits above page content but below the hamburger drawer (z-40) so
 * the drawer covers it when open. Auth-gated tabs open the auth modal for
 * guests instead of navigating to a login-gated page.
 */
export default function BottomNav() {
  const t = useTranslations('bottomNav');
  const pathname = usePathname();
  const user = useSelector((state: any) => state.auth.user);
  const { openAuthModal } = useAuthModel();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Primary"
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-black/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-stretch">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          const Icon = active ? tab.IconActive : tab.Icon;
          const guestGated = tab.requiresAuth && !user;
          return (
            <li key={tab.key} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                onClick={
                  guestGated
                    ? (e) => {
                        e.preventDefault();
                        openAuthModal();
                      }
                    : undefined
                }
                className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors ${
                  active ? 'text-white' : 'text-gray-500'
                }`}
              >
                <Icon size={22} />
                <span>{t(tab.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
