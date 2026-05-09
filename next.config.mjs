import createNextIntlPlugin from 'next-intl/plugin';

// Wires `i18n/request.ts` so server components can call `getMessages()` etc.
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['img.ophim.live', 'lh3.googleusercontent.com', 'image.tmdb.org'],
  },
  // Required by PostHog reverse proxy: PostHog endpoints must NOT have a
  // trailing-slash redirect applied — that would break event ingestion.
  skipTrailingSlashRedirect: true,
  async redirects() {
    return [
      // Preserve old non-localized URLs by routing them to the default locale.
      // SEO + bookmarks won't 404 after the [locale] migration.
      {
        source: '/movies/:path*',
        destination: '/vi/movies/:path*',
        permanent: false,
      },
      {
        source: '/profile/:path*',
        destination: '/vi/profile/:path*',
        permanent: false,
      },
      {
        source: '/search',
        destination: '/vi/search',
        permanent: false,
      },
    ];
  },
  // PostHog reverse proxy — routes analytics traffic through our own domain to
  // bypass ad-blockers (which block *.posthog.com directly, costing ~20-30%
  // of real-user data). Must be `rewrites` (not redirects) so the URL stays
  // `/ingest/...` from the browser's perspective.
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://us.i.posthog.com/decide',
      },
    ];
  },
};

export default withNextIntl(nextConfig);
