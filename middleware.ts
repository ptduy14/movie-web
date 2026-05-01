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
 * Combined middleware:
 *  1. Strips locale prefix to evaluate path against protected list.
 *  2. If protected + no auth → redirect to locale-aware home.
 *  3. Otherwise delegates to next-intl for locale detection / redirection.
 *
 * Order matters: we run auth check BEFORE next-intl so unauthenticated users
 * get redirected to `/vi` or `/en` (their current locale) rather than a 404.
 */
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /vi/movies/collection → /movies/collection
  const pathWithoutLocale = pathname.replace(LOCALE_PREFIX_REGEX, '') || '/';

  const isProtected = PROTECTED_PATHS.some((p) => pathWithoutLocale.startsWith(p));
  if (isProtected && !request.cookies.has('accessToken')) {
    const match = pathname.match(LOCALE_PREFIX_REGEX);
    const locale = match?.[1] ?? routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  // Skip Next.js internals, API routes, Vercel routes, and static files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
