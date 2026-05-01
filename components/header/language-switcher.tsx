'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { useSelector } from 'react-redux';
import { useRouter, usePathname, type Locale } from 'i18n/routing';
import { doc, setDoc } from 'firebase/firestore';
import { db } from 'lib/firebase';
import { IoLanguage, IoChevronDown } from 'react-icons/io5';

interface LocaleOption {
  code: Locale;
  flag: string;
  label: string;
}

const LOCALES: LocaleOption[] = [
  { code: 'vi', flag: '🇻🇳', label: 'Tiếng Việt' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
];

/**
 * Compact language switcher for the header.
 *
 * Behavior:
 *  - Guest: persists choice via the locale cookie (set by next-intl router).
 *  - Logged-in: ALSO persists `preferredLocale` to Firestore so it syncs across
 *    devices on next login.
 *
 * Click outside → close. Click an option → switch route preserving current path.
 */
export default function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: any) => state.auth.user);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleSelect = (locale: Locale) => {
    setOpen(false);
    if (locale === currentLocale) return;

    // Update route immediately — next-intl handles cookie + URL prefix change
    startTransition(() => {
      router.replace(pathname, { locale });
    });

    // Best-effort sync to Firestore for logged-in users (non-blocking)
    if (user?.id) {
      const userRef = doc(db, 'users', user.id);
      setDoc(userRef, { preferredLocale: locale }, { merge: true }).catch((err) => {
        console.log('preferredLocale sync error:', err.message);
      });
    }
  };

  const current = LOCALES.find((l) => l.code === currentLocale) ?? LOCALES[0];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-white/10 transition-colors"
        aria-label="Chọn ngôn ngữ / Select language"
        aria-expanded={open}
      >
        <IoLanguage className="text-lg" />
        <span className="text-sm font-medium uppercase">{current.code}</span>
        <IoChevronDown
          className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul className="absolute right-0 top-full mt-2 min-w-[10rem] bg-black border border-neutral-800 rounded shadow-xl py-1 z-50">
          {LOCALES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                onClick={() => handleSelect(l.code)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-white/10 transition-colors ${
                  l.code === currentLocale ? 'text-red-400 font-semibold' : ''
                }`}
              >
                <span className="text-base">{l.flag}</span>
                <span>{l.label}</span>
                {l.code === currentLocale && (
                  <span className="ml-auto text-red-500">✓</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
