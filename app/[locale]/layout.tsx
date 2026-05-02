import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from 'i18n/routing';
import '../globals.css';
import 'swiper/css';
import 'swiper/css/effect-fade';
import Providers from '../providers';

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

  return (
    <html lang={locale}>
      <body className="bg-black text-white relative flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
