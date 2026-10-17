import { BROWSE_FORMAT_SLUGS } from 'constants/catalog-taxonomy';
import { FORMAT_MAP } from 'constants/i18n-mappings';

/**
 * The four header-menu formats, derived from the catalog taxonomy so the menu and
 * the discover constraints can never drift apart.
 */
const movieFormat = BROWSE_FORMAT_SLUGS.map((slug) => ({
  name: FORMAT_MAP.vi[slug] ?? slug,
  slug,
}));

export default movieFormat;
