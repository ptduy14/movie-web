import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

/**
 * Locale routing configuration for next-intl.
 *
 * - `locales`: enabled locales. Add new ones here, then create a corresponding
 *   `messages/{locale}.json` file.
 * - `defaultLocale`: used when middleware can't determine a preferred locale.
 * - `localePrefix: 'always'`: every URL is prefixed (`/vi/...`, `/en/...`).
 *   Chosen for clean URL semantics and SEO clarity.
 */
export const routing = defineRouting({
  locales: ['vi', 'en'],
  defaultLocale: 'vi',
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];

/**
 * Locale-aware navigation primitives. Use these instead of next/link, next/router
 * to ensure links automatically include the active locale prefix.
 *
 *   import { Link } from 'i18n/routing';
 *   <Link href="/movies/abc">...</Link>   // → /vi/movies/abc when locale=vi
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
