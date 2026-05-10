import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { routing } from 'i18n/routing';
import '../globals.css';
import 'swiper/css';
import 'swiper/css/effect-fade';
import Providers from '../providers';
import { DISCLAIMER_COOKIE_NAME } from '@/components/disclaimer/disclaimer-constants';

/**
 * Locale segment layout — owns the full app shell.
 *
 * Tree:
 *   <html lang={locale}>
 *     <body>
 *       <NextIntlClientProvider>
 *         <Providers>           ← Redux/Auth/Modal/Loading/Dropdown
 *           <Layout>             ← Header / Footer (inside Providers)
 *             {children}         ← page content
 *
 * - Re-renders on every locale segment change → `useLocale()` / `useTranslations()`
 *   always reflect the active locale, even after client soft-navigation.
 * - Redux state persists across locale changes because the store is a module-level
 *   singleton; Provider re-renders pass the same store reference, so React keeps
 *   the same store and connected components retain their state.
 * - `setRequestLocale()` enables static rendering for child server components.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  const cookieStore = await cookies();
  const disclaimerEnabled = process.env.NEXT_PUBLIC_DISCLAIMER_MODAL_ENABLED === 'true';
  const cookieAccepted = cookieStore.get(DISCLAIMER_COOKIE_NAME)?.value === '1';
  const initialDisclaimerAccepted = !disclaimerEnabled || cookieAccepted;

  return (
    <html lang={locale}>
      <body className="bg-black text-white relative flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers initialDisclaimerAccepted={initialDisclaimerAccepted}>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
