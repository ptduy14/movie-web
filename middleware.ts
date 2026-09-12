import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { isMaintenanceMode } from './lib/maintenance';

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_PATHS = ['/movies/collection', '/movies/recent'];
const LOCALE_PREFIX_REGEX = new RegExp(`^/(${routing.locales.join('|')})(?=/|$)`);
const LOCALE_COOKIE = 'NEXT_LOCALE';
const LOCALE_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;
const MAINTENANCE_PREFIX = '/maintenance';

/**
 * Vercel-only geo signal. Returns null on local dev / non-Vercel hosts so the
 * caller falls through to next-intl's Accept-Language detection.
 *
 * Policy: VN → vi, every other country → en.
 */
function pickLocaleFromGeo(request: NextRequest): string | null {
  const country = request.geo?.country;
  if (!country) return null;
  return country === 'VN' ? 'vi' : 'en';
}

/**
 * Locale for the maintenance page: explicit URL prefix wins, then the user's
 * stored choice, then geo, then the default. Never touches next-intl — the
 * maintenance route lives outside the `[locale]` segment.
 */
function resolveMaintenanceLocale(request: NextRequest): string {
  const prefix = request.nextUrl.pathname.match(LOCALE_PREFIX_REGEX)?.[1];
  if (prefix) return prefix;

  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie && routing.locales.includes(cookie as any)) return cookie;

  return pickLocaleFromGeo(request) ?? routing.defaultLocale;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathWithoutLocale = pathname.replace(LOCALE_PREFIX_REGEX, '') || '/';
  const isMaintenancePath = pathname.startsWith(MAINTENANCE_PREFIX);

  // ---- Maintenance gate ----
  // Runs before everything else so a gated request never reaches a layout,
  // a provider, or a movie API call. The maintenance route renders on its own
  // (own <html>, no Providers), so it's simply let through.
  if (isMaintenanceMode()) {
    if (isMaintenancePath) return NextResponse.next();

    const url = new URL(`${MAINTENANCE_PREFIX}/${resolveMaintenanceLocale(request)}`, request.url);
    const response = NextResponse.rewrite(url);
    // The URL still looks like a normal page, so keep crawlers off the
    // stand-in content while the real page is unavailable.
    response.headers.set('x-robots-tag', 'noindex');
    return response;
  }

  // Maintenance is off — the page has nothing to say, send visitors home.
  if (isMaintenancePath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Auth gate
  const isProtected = PROTECTED_PATHS.some((p) => pathWithoutLocale.startsWith(p));
  if (isProtected && !request.cookies.has('accessToken')) {
    const match = pathname.match(LOCALE_PREFIX_REGEX);
    const locale = match?.[1] ?? routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  // Geo auto-detect — only for first-time bare-URL visitors. Manual choice
  // (stored in NEXT_LOCALE) wins forever after.
  const hasLocalePrefix = LOCALE_PREFIX_REGEX.test(pathname);
  const hasLocaleCookie = request.cookies.has(LOCALE_COOKIE);
  if (!hasLocalePrefix && !hasLocaleCookie) {
    const geoLocale = pickLocaleFromGeo(request);
    if (geoLocale) {
      const targetPath = pathname === '/' ? `/${geoLocale}` : `/${geoLocale}${pathname}`;
      const url = new URL(targetPath, request.url);
      url.search = request.nextUrl.search;

      const response = NextResponse.redirect(url);
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
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
