import createNextIntlPlugin from 'next-intl/plugin';

// Wires `i18n/request.ts` so server components can call `getMessages()` etc.
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['img.ophim.live', 'lh3.googleusercontent.com', 'image.tmdb.org'],
  },
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
};

export default withNextIntl(nextConfig);
