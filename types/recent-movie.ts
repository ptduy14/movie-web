export interface IRecentMovie {
  userId?: string;
  id: string;
  slug: string;
  thumb_url: string;
  name: string;
  origin_name: string;
  lang: string;
  quality: string;
  // Watch progress fields — populated as the user watches; absent for entries
  // created on a first-time visit before the player has saved any position.
  progressTime?: number;
  progressEpIndex?: number;
  progressEpLink?: string;
  // Total duration of the episode being watched (seconds). Combined with
  // `progressTime` to compute the % completion bar in "Continue Watching".
  // Optional because (a) legacy entries pre-date this field and (b) the
  // player may not have reported `loadedmetadata` yet when the entry is first
  // written. Treat missing/zero as "no bar shown".
  progressDuration?: number;
  // Wall-clock ms-since-epoch of the latest write. Used to sort the
  // "Continue Watching" list (most-recent-first) and to drive LRU eviction
  // in the localStorage layer for guest users.
  updatedAt?: number;
}
