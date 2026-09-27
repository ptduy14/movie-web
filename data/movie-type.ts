import { BROWSE_GENRE_SLUGS } from 'constants/tmdb-taxonomy';
import { CATEGORY_MAP } from 'constants/i18n-mappings';

/**
 * Genres offered in the header menu, derived from the catalog taxonomy so a
 * new genre only has to be declared in one place.
 *
 * `name` is the Vietnamese label; render sites that care about locale call
 * `localizedCategory(slug, locale)` instead of reading this.
 */
const movieType = BROWSE_GENRE_SLUGS.map((slug) => ({
  name: CATEGORY_MAP.vi[slug] ?? slug,
  slug,
}));

export default movieType;
