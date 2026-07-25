import createNextIntlPlugin from 'next-intl/plugin';

// Wires `i18n/request.ts` so server components can call `getMessages()` etc.
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    // Self-hosted resize via app/api/image (sharp), NOT Vercel's metered
    // Image Optimization API — see docs/pagespeed-performance-audit.md C1.
    loader: 'custom',
    loaderFile: './image-loader.ts',
    remotePatterns: [
      { protocol: 'https', hostname: 'img.ophim.live' },
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
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
  async rewrites() {
    return [
      {
        source: '/api/__relay/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/api/__relay/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ];
  },
};

export default withNextIntl(nextConfig);
