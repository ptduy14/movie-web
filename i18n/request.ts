import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

/**
 * Server-side i18n configuration for next-intl.
 *
 * Resolves the active locale from the request and loads the corresponding
 * messages file. Falls back to default locale if the requested one is invalid.
 *
 * Wired to the next-intl plugin in `next.config.mjs`.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
