import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MovieX',
  description: 'Xem phim online miễn phí',
};

/**
 * Root layout — minimal pass-through.
 *
 * Why so empty?
 *   The full app shell (html, body, Providers, NextIntlClientProvider) lives
 *   in `app/[locale]/layout.tsx`. This is the official next-intl App Router
 *   pattern: it ensures `<NextIntlClientProvider>` re-renders on every locale
 *   segment change, keeping `useLocale()` / `useTranslations()` always fresh.
 *
 *   Root layout is required by Next.js but doesn't need html/body when a
 *   nested layout supplies them.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
