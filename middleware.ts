import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Auth-protected paths (after locale prefix is stripped). Redirect to home
 * (preserving locale) if user has no accessToken cookie.
 */
const PROTECTED_PATHS = ['/movies/collection', '/movies/recent'];

const LOCALE_PREFIX_REGEX = new RegExp(`^/(${routing.locales.join('|')})(?=/|$)`);

/**
 * Cookie name used by next-intl to remember a user's manual locale choice.
 * Once present we stop auto-detecting so the user's preference sticks even
 * if they roam (VPN, travel, etc.).
 */
const LOCALE_COOKIE = 'NEXT_LOCALE';

/**
 * 1 year — long enough that the detection effectively runs once per device.
 */
const LOCALE_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

/**
 * Geo-based locale picker. `request.geo` is attached by Vercel's Edge Network
 * (free, no API call). Returns `null` on local dev / non-Vercel runs so the
 * caller falls through to next-intl's Accept-Language detection.
 *
 * Policy (chosen 2026-05-16):
 *   VN  → vi  (primary audience)
 *   *   → en  (everyone else gets English — safer for a Vietnamese catalog
 *              where most non-VN viewers won't read Vietnamese)
 */
function pickLocaleFromGeo(request: NextRequest): string | null {
  const country = request.geo?.country;
  if (!country) return null;
  return country === 'VN' ? 'vi' : 'en';
}

/**
 * Combined middleware:
 *  1. Strips locale prefix to evaluate path against protected list.
 *  2. If protected + no auth → redirect to locale-aware home.
 *  3. Geo-based locale auto-detect (only when URL has no locale prefix AND
 *     no `NEXT_LOCALE` cookie — i.e., first-time bare-URL visitors).
 *  4. Otherwise delegates to next-intl for Accept-Language fallback + locale
 *     prefix enforcement.
 *
 * Order matters: auth → geo → next-intl. Geo runs before next-intl so we
 * override its Accept-Language default with our geographic signal.
 */
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /vi/movies/collection → /movies/collection
  const pathWithoutLocale = pathname.replace(LOCALE_PREFIX_REGEX, '') || '/';

  // ───── Auth gate ─────
  const isProtected = PROTECTED_PATHS.some((p) => pathWithoutLocale.startsWith(p));
  if (isProtected && !request.cookies.has('accessToken')) {
    const match = pathname.match(LOCALE_PREFIX_REGEX);
    const locale = match?.[1] ?? routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  // ───── Geo auto-detect ─────
  // Only intercept when:
  //  - URL has no locale prefix (don't re-redirect /vi/…),
  //  - User has no NEXT_LOCALE cookie (manual choice wins forever after).
  const hasLocalePrefix = LOCALE_PREFIX_REGEX.test(pathname);
  const hasLocaleCookie = request.cookies.has(LOCALE_COOKIE);
  if (!hasLocalePrefix && !hasLocaleCookie) {
    const geoLocale = pickLocaleFromGeo(request);
    if (geoLocale) {
      // Build the target URL: `/{locale}` + original path (minus the leading
      // `/` which we re-add) + original query string.
      const targetPath = pathname === '/' ? `/${geoLocale}` : `/${geoLocale}${pathname}`;
      const url = new URL(targetPath, request.url);
      url.search = request.nextUrl.search;

      const response = NextResponse.redirect(url);
      // Persist the choice so this whole branch is skipped on later visits.
      // `lax` is enough — we don't need cross-site context for locale.
      response.cookies.set(LOCALE_COOKIE, geoLocale, {
        path: '/',
        maxAge: LOCALE_COOKIE_MAX_AGE_SEC,
        sameSite: 'lax',
      });
      return response;
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Skip Next.js internals, API routes, Vercel routes, and static files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
