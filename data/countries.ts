import { BROWSE_COUNTRY_SLUGS } from 'constants/catalog-taxonomy';
import { COUNTRY_MAP } from 'constants/i18n-mappings';

/**
 * Countries offered in the header menu, derived from the catalog taxonomy.
 *
 * `name` is the Vietnamese label; render sites call
 * `localizedCountry(slug, locale)` for the locale-correct one.
 */
const countries = BROWSE_COUNTRY_SLUGS.map((slug) => ({
  name: COUNTRY_MAP.vi[slug] ?? slug,
  slug,
}));

export default countries;
