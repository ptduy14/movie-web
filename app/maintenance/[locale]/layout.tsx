import type { Metadata, Viewport } from 'next';
import '../../globals.css';

/**
 * Maintenance shell — intentionally NOT `app/[locale]/layout.tsx`.
 *
 * This route lives outside the `[locale]` segment so that gating a request
 * here mounts none of the app shell: no Redux store, no PostHog, no Firebase
 * auth listener, no disclaimer/intro gates, no header/footer — and therefore
 * no movie API calls. It supplies its own <html>/<body>, which the pass-through
 * root layout (`app/layout.tsx`) allows.
 */
export const metadata: Metadata = {
  title: 'MOVIEX',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export default async function MaintenanceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <html lang={locale}>
      <body className="bg-black text-white">{children}</body>
    </html>
  );
}
