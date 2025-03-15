export interface IRecentMovie {
  userId?: string,
  id: string;
  slug: string;
  thumb_url: string;
  name: string;
  origin_name: string;
  lang: string;
  quality: string;
  progressTime?: number;
  progressEpIndex?: number;
  progressEpLink?: string;
}
