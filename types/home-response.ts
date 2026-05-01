import NewlyMovie from './newly-movie';

export interface HomeSeoOnPage {
  titleHead: string;
  descriptionHead: string;
  og_type: string;
  og_image: string[];
}

export interface HomePagination {
  totalItems: number;
  totalItemsPerPage: number;
  currentPage: number;
  pageRanges: number;
}

export interface HomeParams {
  type_slug: string;
  filterCategory: string[];
  filterCountry: string[];
  filterYear: string;
  sortField: string;
  pagination: HomePagination;
  itemsUpdateInDay: number;
  totalSportsVideos: number;
  itemsSportsVideosUpdateInDay: number;
}

export interface HomeApiData {
  seoOnPage: HomeSeoOnPage;
  items: NewlyMovie[];
  itemsSportsVideos: unknown[];
  params: HomeParams;
  type_list: string;
  APP_DOMAIN_FRONTEND: string;
  APP_DOMAIN_CDN_IMAGE: string;
}

/**
 * Top-level response shape of `/v1/api/home`.
 * Note the `data` wrapper — consistent with other v1 endpoints.
 */
export default interface HomeApiResponse {
  status: string;
  message: string;
  data: HomeApiData;
}
