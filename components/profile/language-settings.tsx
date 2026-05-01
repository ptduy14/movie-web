'use client';

import { useTransition } from 'react';
import { IoLanguage, IoCheckmark } from 'react-icons/io5';
import { useLocale, useTranslations } from 'next-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, usePathname, type Locale } from 'i18n/routing';
import { doc, setDoc } from 'firebase/firestore';
import { db } from 'lib/firebase';

interface Language {
  code: Locale;
  name: string; // English name (used as secondary label)
  nativeName: string; // Display in native script
  flag: string;
}

// Phase 1 supports vi + en. JA/KO can be added later by updating
// `i18n/routing.ts` locales + adding `messages/<locale>.json`.
const LANGUAGES: Language[] = [
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
];

/**
 * Profile-level language settings.
 *
 * Wired to next-intl: clicking a locale immediately switches the route
 * (preserving current path) and — for logged-in users — persists the choice
 * to Firestore (`users/{uid}.preferredLocale`) so it syncs across devices.
 */
export default function LanguageSettings() {
  const t = useTranslations('profile.language');
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: any) => state.auth.user);
  const [isPending, startTransition] = useTransition();
  const dispatch = useDispatch();

  const handleLanguageChange = (languageCode: Locale) => {
    if (languageCode === currentLocale) return;

    startTransition(() => {
      router.replace(pathname, { locale: languageCode });
    });

    // Best-effort sync to Firestore (non-blocking)
    if (user?.id) {
      const userRef = doc(db, 'users', user.id);
      setDoc(userRef, { preferredLocale: languageCode }, { merge: true }).catch((err) => {
        console.log('preferredLocale sync error:', err.message);
      });
    }
  };

  const current = LANGUAGES.find((lang) => lang.code === currentLocale) ?? LANGUAGES[0];

  return (
    <div>
      <div className="flex items-center space-x-3 mb-6">
        <IoLanguage className="text-custome-red" size={24} />
        <h2 className="text-xl font-semibold text-white">{t('heading')}</h2>
      </div>

      <div className="mb-6">
        <p className="text-gray-400">{t('description')}</p>
      </div>

      {/* Language Selection */}
      <div className="space-y-3">
        {LANGUAGES.map((language) => {
          const isSelected = currentLocale === language.code;
          return (
            <div
              key={language.code}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-custome-red bg-red-900/20'
                  : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/30'
              }`}
              onClick={() => handleLanguageChange(language.code)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">{language.flag}</span>
                  <div>
                    <h3 className="text-white font-medium">{language.nativeName}</h3>
                    <p className="text-gray-400 text-sm">{language.name}</p>
                  </div>
                </div>

                {isSelected && (
                  <div className="flex items-center space-x-2">
                    {isPending ? (
                      <div className="w-5 h-5 border-2 border-custome-red border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <IoCheckmark className="text-custome-red" size={20} />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Language Info */}
      <div className="mt-8 p-4 bg-gray-800/30 border border-gray-600 rounded-lg">
        <h3 className="text-white font-medium mb-2">{t('current')}</h3>
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{current.flag}</span>
          <div>
            <p className="text-white">{current.nativeName}</p>
            <p className="text-gray-400 text-sm">{current.name}</p>
          </div>
        </div>
      </div>

      {/* Language Info */}
      <div className="mt-8 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
        <h4 className="text-blue-400 font-medium mb-2">{t('infoHeading')}</h4>
        <p className="text-gray-400 text-sm">{t('infoMessage')}</p>
      </div>
    </div>
  );
}
