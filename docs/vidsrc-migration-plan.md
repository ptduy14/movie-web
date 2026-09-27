# Implementation Plan — Migration hoàn toàn sang vidsrc.sh + TMDB

> **Status:** Approved — chờ thực thi (bắt đầu 2026-09-21)
> **Owner:** ptduy14
> **Created:** 2026-09-20
> **Quyết định nguồn:** [`vidsrc-investigation.md`](./vidsrc-investigation.md) §9 đề xuất hybrid; **user chốt đi full vidsrc**. Plan này thực hiện đúng quyết định đó.
> **Thay thế:** [`vsmov-migration.md`](./vsmov-migration.md) không còn là đường đi — giữ lại làm tham chiếu lịch sử.

---

## 0. Ba quyết định đã chốt

| # | Câu hỏi | Chốt |
|---|---|---|
| D1 | Pipeline dịch (Groq + Firestore + cron) | **Giữ làm fallback.** TMDB `vi-VN` trước; rỗng → Groq dịch. Re-key cache sang TMDB id |
| D2 | Data user cũ (recentMovies, comments, collections, notifications) | **Wipe sạch**, schema mới key theo TMDB id |
| D3 | Cách giao việc | **Commit thẳng lên `main`**, không PR. Chia nhiều commit theo phase để rollback được từng bước |

---

## 1. Kiến trúc đích

```
┌─────────────────────────────────────────────────────────────┐
│  TMDB  — catalog, search, discover, metadata, ảnh, credits  │
│          language=vi-VN | en-US theo locale                 │
└────────────────────────┬────────────────────────────────────┘
                         │  tmdb id + media type
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  lib/tmdb-adapter.ts  — TMDB → view model hiện có            │
│  (NewlyMovie / Movie / DetailMovie / Episode)                │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┴───────────────┐
          ▼                              ▼
┌──────────────────────┐   ┌──────────────────────────────────┐
│ Upstash Redis        │   │ vidsrc.sh /embed/...             │
│ availability index   │   │ iframe + postMessage bridge      │
│ (lọc phim xem được)  │   │                                  │
└──────────────────────┘   └──────────────────────────────────┘
```

**Nguyên tắc chỉ đạo:** giữ nguyên tên và shape của view model (`NewlyMovie`, `Movie`, `DetailMovie`, `Episode`) vì hơn 30 component đang import chúng. Chỉ **đổi nguồn gốc dữ liệu**, không đổi hợp đồng với tầng UI. Nhờ vậy blast radius thật sự thu nhỏ còn khoảng **25 file** thay vì 40–50 như ước tính ban đầu trong investigation.

---

## 2. Phát hiện trong lúc khảo sát — đọc trước khi code

Những thứ này đã probe/đọc code thật ngày 2026-09-20. Chúng thay đổi thiết kế, đừng bỏ qua.

### 2.1 🔴 Redis đang KHÔNG hoạt động

`lib/upstash.ts` đọc `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`. Nhưng `.env` chỉ có `KV_REST_API_URL` + `KV_REST_API_TOKEN` (tên biến do Vercel KV/Upstash integration inject). ⇒ `redis` hiện resolve thành **`null`**, mọi cache TMDB images đang **im lặng bypass**.

Availability index phụ thuộc hoàn toàn vào Redis, nên **đây là việc đầu tiên của Phase 1**: cho `lib/upstash.ts` chấp nhận cả hai bộ tên biến. Đây cũng là một bug đang tồn tại sẵn, không phải do migration.

### 2.2 TMDB vi-VN — có thật, nhưng thủng

| Title | `title` vi-VN | `overview` vi-VN |
|---|---|---|
| Iron Man 3 (68721) | "Người Sắt 3" | đầy đủ |
| Game of Thrones (tv 1399) | "Trò Chơi Vương Quyền" | đầy đủ |
| Due Dating (1083312) | rơi về "Due Dating" | **`""` (rỗng)** |
| Der Stein des Todes (200847) | rơi về tên gốc | **`""` (rỗng)** |

⇒ D1 (giữ Groq) là đúng. **Nhưng hướng dịch đảo ngược:** trước đây OPhim cho tiếng Việt và Groq dịch VI→EN. Giờ TMDB cho tiếng Anh và ta cần VI→ nên Groq dịch **EN→VI**. Locale `en` từ nay **không cần dịch gì cả**.

Phải sửa: `groq-translation-service.ts` (system prompt đang hardcode *"You translate Vietnamese movie synopses to X"*), `LOCALE_LANGUAGE_NAMES` (thiếu `vi`), và điều kiện `if (locale === 'vi') return original` trong `movie-content-localizer.ts` — điều kiện này giờ **ngược**.

### 2.3 Các bẫy nhỏ của TMDB

| Bẫy | Xử lý |
|---|---|
| `movie 1399` ≠ `tv 1399` — hai chuỗi id độc lập, **trùng số** | Mọi khoá phải mang media type: `tv-1399`. Đã có `lib/media-key.ts` |
| `seasons[]` có **season 0 "Specials" với 300 tập** (GoT) | Lọc bỏ `season_number === 0` |
| `episode_run_time: []` với GoT | `time` phải có fallback, không assume mảng có phần tử |
| `videos` bị lọc theo `language` — vi-VN trả `[]` cho Iron Man 3 | Fetch trailer bằng call riêng `en-US`, hoặc `include_video_language=vi,en,null` |
| `genres` vi-VN có tiền tố "Phim " ("Phim Hành Động") | Không dùng label của TMDB; dùng `CATEGORY_MAP` của mình |
| Movie và TV có **bộ genre khác nhau** (10759 Action&Adventure chỉ có ở TV) | Đã tách 2 map trong `constants/tmdb-taxonomy.ts` |

### 2.4 Genre id — đã verify live (`/3/genre/{movie,tv}/list`, 2026-09-20)

Movie: 28 Action · 12 Adventure · 16 Animation · 35 Comedy · 80 Crime · 99 Documentary · 18 Drama · 10751 Family · 14 Fantasy · 36 History · 27 Horror · 10402 Music · 9648 Mystery · 10749 Romance · 878 Sci-Fi · 10770 TV Movie · 53 Thriller · 10752 War · 37 Western

TV: 10759 Action & Adventure · 16 · 35 · 80 · 99 · 18 · 10751 · 10762 Kids · 9648 · 10763 News · 10764 Reality · 10765 Sci-Fi & Fantasy · 10766 Soap · 10767 Talk · 10768 War & Politics · 37

### 2.5 Việc KHÔNG cần làm (đã sẵn sàng)

- `image.tmdb.org` **đã có** trong `ALLOWED_HOSTS` (`app/api/image/route.ts`) và `remotePatterns` (`next.config.mjs`).
- `NEXT_PUBLIC_TMDB_IMG_DOMAIN` **đã có** trong `.env`.
- Mọi badge (`RatingBadge`, `QualityLangBadge`, `NewUpdateBadge`, `ExclusiveBadge`) **đã tolerant** với field thiếu → không crash khi TMDB không cung cấp.
- `services/tmdb-images-cache.ts` đã có sẵn pattern cache Upstash để nhân bản cho availability index.
- Filter bar đã ẩn count khi `count === null`.

### 2.6 Lưu ý thao tác

`.env` để giá trị trong dấu nháy kép (`NEXT_PUBLIC_TMDB_ACCESS_TOKEN="eyJ..."`). Next.js tự bóc nháy nên **app chạy bình thường**; chỉ khi probe thủ công bằng `curl` trong shell mới phải `tr -d '"'`. Đừng "sửa" `.env` vì tưởng nó hỏng.

---

## 3. Bảng ánh xạ trường: TMDB → view model

Đây là hợp đồng của `lib/tmdb-adapter.ts`. Cột "Ghi chú" là chỗ dễ sai nhất.

| Field | Nguồn TMDB | Ghi chú |
|---|---|---|
| `_id` | `mediaId(type, id)` | `"movie-68721"`. **Bắt buộc namespace** (§2.3) |
| `slug` | `buildSlug(type, id, title)` | `"nguoi-sat-3-movie-68721"`. Phần chữ chỉ để đẹp, parse chỉ đọc đuôi |
| `name` | `title` / `name` (theo locale) | TMDB tự fallback về tên gốc khi thiếu bản dịch |
| `origin_name` | `original_title` / `original_name` | |
| `thumb_url` | `poster_path` | URL **tuyệt đối** `…/t/p/w500/abc.jpg` |
| `poster_url` | `backdrop_path` | URL tuyệt đối `…/t/p/w1280/xyz.jpg`, fallback về poster |
| `year` | năm của `release_date` / `first_air_date` | |
| `tmdb` | `{ type, id: String(id), season: 1, vote_average, vote_count }` | |
| `imdb` | `{ id: external_ids.imdb_id, vote_average: 0, vote_count: 0 }` | TMDB **không** trả điểm IMDb → `RatingBadge` chỉ hiện chip TMDB. Chấp nhận |
| `modified` | `undefined`, trừ item lấy từ feed latest của vidsrc → `time_added` | Badge "MỚI" chỉ sáng ở row "Mới cập nhật" |
| `type` | `movie`→`single`; `tv`→`series`; có genre 16→`hoathinh`; reality/talk/news→`tvshows` | `isHaveEpisodesMovie()` đang dựa vào `type !== 'single'` |
| `quality` | từ feed latest vidsrc nếu có, nếu không **để `undefined`** | Không bịa "HD" |
| `lang` | hằng `'Phụ đề'` | Thêm vào `LANG_MAP`: vi `'Phụ đề'`, en `'Subtitled'`. Trung thực với vidsrc |
| `episode_current` | tv `status==='Ended'` → `Hoàn tất (N/N)`, else `Tập N`; movie → `Full` | |
| `time` | movie `runtime` → `"130 Phút"`; tv `episode_run_time[0]` → `"45 phút/tập"` | Mảng rỗng → `''` (§2.3) |
| `sub_docquyen` | `false` | `ExclusiveBadge` không bao giờ hiện |
| `chieurap` | `false` | |
| `category[]` | `genres[]` hoặc `genre_ids[]` → `{id, name, slug}` | `slug` từ `slugForGenreId(id, mediaType)`; `name` từ `CATEGORY_MAP` |
| `country[]` | `origin_country[]` → `{id, name, slug}` | `slug` từ `countrySlugForIso()` |
| `content` | `overview` (+ Groq fallback khi rỗng ở locale vi) | |
| `actor[]` | `credits.cast[].name` | |
| `director[]` | `credits.crew` lọc `job === 'Director'` | |
| `trailer_url` | `videos.results` lọc `site==='YouTube' && type==='Trailer'` | Call riêng `en-US` (§2.3) |

### `DetailMovie.episodes` — chỗ thiết kế quan trọng nhất

Tái dụng cấu trúc `episodes[serverIndex].server_data[episodeIndex]` sẵn có, nhưng **đổi ý nghĩa của "server" thành "mùa"**:

| | Movie | TV |
|---|---|---|
| `episodes.length` | 1 | số mùa (đã loại season 0) |
| `server_name` | `"vidsrc"` | `"Phần 1"`, `"Phần 2"`… |
| `server_data` | 1 phần tử `Full` | các tập của mùa đó |
| `link_embed` | URL vidsrc | URL vidsrc kèm `/season/episode` |
| `link_m3u8` | `''` | `''` — **không còn m3u8, đây là field chết** |

Nhờ vậy selector "server" (vốn là bộ chọn Vietsub/Thuyết minh) trở thành **bộ chọn mùa** mà không phải đổi cấu trúc dữ liệu. Chỉ đổi nhãn i18n.

---

## 4. Phân rã công việc theo commit

### Phase 1 — Nền tảng dữ liệu
> Không đụng UI. Sau phase này app vẫn chạy như cũ (code mới chưa được import).

| # | File | Việc | Trạng thái |
|---|---|---|---|
| 1.1 | `lib/upstash.ts` | Chấp nhận cả `KV_REST_API_*` lẫn `UPSTASH_REDIS_REST_*` (§2.1) | |
| 1.2 | `constants/tmdb-taxonomy.ts` | Genre/country/format slug ↔ TMDB | ✅ **đã viết** |
| 1.3 | `lib/media-key.ts` | `mediaId` / `buildSlug` / `parseSlug` | ✅ **đã viết** |
| 1.4 | `types/tmdb-api.ts` | Shape thô của TMDB | ✅ **đã viết** |
| 1.5 | `lib/tmdb-image.ts` | `resolveImageUrl()` — cho URL tuyệt đối đi thẳng, path tương đối thì prepend | |
| 1.6 | `services/tmdb-catalog-service.ts` | `tmdbFetch()` có `res.ok` + timeout + revalidate; discover / search / trending / detail / season | |
| 1.7 | `lib/tmdb-adapter.ts` | Bảng §3 | |
| 1.8 | `services/vidsrc-service.ts` | Builder URL embed, feed latest, tải `/ids/*.txt` | |

**Commit:** `feat(catalog): add TMDB catalog layer and vidsrc service`

### Phase 2 — Availability index
| # | File | Việc |
|---|---|---|
| 2.1 | `services/vidsrc-availability.ts` | Redis SET `vs:movie` / `vs:tv`; `isAvailable()`, `filterAvailable()`; degrade thành "cho qua hết" khi Redis null |
| 2.2 | `app/api/vidsrc/sync-ids/route.ts` | Cron tải `/ids/movie_tmdb.txt` + `tv_tmdb.txt` → nạp SET. Bảo vệ bằng `CRON_SECRET` như cron dịch |
| 2.3 | `vercel.json` hoặc cron config | Lịch chạy hằng ngày |

Bỏ qua episode-level (508k dòng) — để player tự báo tập thiếu.

**Commit:** `feat(catalog): add vidsrc availability index synced from ID lists`

### Phase 3 — Đấu nối tầng đọc dữ liệu
| # | File | Việc |
|---|---|---|
| 3.1 | `services/movie-services.ts` | **Xoá.** Thay bằng `services/catalog-service.ts` với cùng bộ hàm (`getNewlyMovies`, `getMoviesType`, …) nhưng trả về view model đã adapt |
| 3.2 | `app/actions.tsx` | Trỏ sang catalog-service; `getDetailMovieServerAction` bỏ vòng fetch-detail-N-lần (TMDB list đã đủ field) |
| 3.3 | `components/home/index.tsx` | Row: trending → vidsrc latest → phim lẻ → phim bộ → hoạt hình → TV show → 3 row genre. `GENRE_ROW_SLUGS` dùng slug mới |
| 3.4 | `app/[locale]/page.tsx` | Bỏ fetch `seoOnPage` của OPhim, dùng chuỗi i18n sẵn có |
| 3.5 | `app/[locale]/movies/[slug]/page.tsx` | `parseSlug()` → detail; bỏ `getMovieImages` (dùng TMDB backdrops) |
| 3.6 | `components/move-type` · `movie-country` · `movie-format` | `MovieFilters` → tham số discover |
| 3.7 | `components/commons/movie-filter-bar.tsx` | Dropdown lấy từ `BROWSE_*_SLUGS`; sort map sang `sort_by` của TMDB |
| 3.8 | `components/search/*` | `/search/multi`, lọc bỏ `media_type === 'person'` |
| 3.9 | 3 call site `NEXT_PUBLIC_IMG_DOMAIN` | Đổi sang `resolveImageUrl()` |
| 3.10 | `constants/i18n-mappings.ts` | Dựng lại `CATEGORY_MAP`/`COUNTRY_MAP` theo taxonomy mới; thêm `'Phụ đề'` vào `LANG_MAP` |
| 3.11 | `data/movie-type.ts` · `data/countries.ts` · `data/move-format.ts` | Sinh từ taxonomy, bỏ hardcode |

**Commit:** `feat(catalog): switch every read path from OPhim to TMDB`

### Phase 4 — Player
| # | File | Việc |
|---|---|---|
| 4.1 | `components/watch/vidsrc-player.tsx` | **Mới.** iframe + `sandbox` bật/tắt qua env (V1 chưa kết luận) |
| 4.2 | `hooks/useVidsrcBridge.ts` | **Mới.** Lắng nghe `PLAYER_EVENT`, `TV_INFO`, `TV_STATE`; gửi `TV_SET`. Lọc theo `event.origin`. Phòng thủ: nếu `TV_SET` không có tác dụng thì đổi `iframe.src` |
| 4.3 | `components/watch/video-player.tsx` + `video-controls/**` (12 file) + `loading-spiner-video-player.tsx` | **Xoá.** Controls nằm trong iframe của họ |
| 4.4 | `hooks/useVideoProgress.ts` | Viết lại quanh postMessage thay vì `videoRef`; resume = remount iframe với `?startAt=` |
| 4.5 | `hooks/useWatchAnalytics.ts` | Nguồn sự kiện đổi sang postMessage |
| 4.6 | `components/watch/index.tsx` | Bộ chọn mùa + danh sách tập dựng từ `episodes[]` (§3) |
| 4.7 | `components/watch/server-section.tsx` | Xoá hoặc đổi thành bộ chọn mùa |
| 4.8 | `package.json` | Gỡ `hls.js` |
| 4.9 | `utils/mobile-fullscreen.ts` | Fullscreen giờ do iframe quản → rà lại, nhiều khả năng xoá |

**Commit:** `feat(player): replace hls.js player with vidsrc iframe embed`

### Phase 5 — Pipeline dịch + wipe dữ liệu
| # | File | Việc |
|---|---|---|
| 5.1 | `services/groq-translation-service.ts` | Đảo hướng dịch EN→VI; thêm `vi` vào `LOCALE_LANGUAGE_NAMES`; sửa system prompt |
| 5.2 | `services/movie-content-localizer.ts` | Điều kiện early-return đảo: bỏ qua khi locale `en`, chỉ dịch khi locale `vi` **và** `overview` rỗng |
| 5.3 | `services/cron-translation-service.ts` | Nguồn duyệt catalog đổi sang TMDB discover/vidsrc ID list; reset cursor |
| 5.4 | `types/cron-meta.ts` · `types/movie-translation.ts` | Comment còn nhắc OPhim `modified.time` — đổi tiêu chí invalidate |
| 5.5 | `scripts/wipe-legacy-collections.js` | **Mới.** Xoá `translations`, `cron_meta`, `recentMovies`, `movies`, comments, collections, notifications. Có `--dry-run` như script migrate sẵn có |

**Commit:** `feat(i18n): flip translation direction to EN→VI and re-key cache` + `chore(data): wipe OPhim-era collections`

### Phase 6 — Dọn dẹp & cutover
| # | Việc |
|---|---|
| 6.1 | Xoá `NEXT_PUBLIC_API_DOMAIN`, `NEXT_PUBLIC_IMG_DOMAIN` khỏi `.env` + Vercel; thêm `NEXT_PUBLIC_VIDSRC_DOMAIN` |
| 6.2 | Gỡ `img.ophim.live` khỏi `ALLOWED_HOSTS` + `remotePatterns` |
| 6.3 | Xoá type chết: `home-response.ts`, `movie-image.ts`; dọn comment nhắc OPhim trong toàn repo |
| 6.4 | `README.md` — đổi mô tả nguồn dữ liệu |
| 6.5 | `CHANGELOG.md` mới + `package.json` `0.1.0` → `1.0.0-rc.1` + `git tag` |
| 6.6 | Tắt `MAINTENANCE_MODE`, smoke test, theo dõi |

**Commit:** `chore: remove OPhim remnants and cut release 1.0.0-rc.1`

---

## 5. Versioning

`0.1.0` → **`1.0.0-rc.1`**.

Viết lại cả tầng dữ liệu lẫn tầng phát video là một sản phẩm khác về bản chất → xứng mốc 1.0. Dùng `-rc.1` chứ chưa phải `1.0.0` vì [`production-audit.md`](./production-audit.md) còn blocker CRITICAL về bảo mật chưa đóng; gắn `1.0.0` trần trụi là tuyên bố production-ready trong khi chưa phải. Đóng xong blocker thì tag `1.0.0`.

Kèm theo: tạo `CHANGELOG.md` (Keep a Changelog), `git tag v1.0.0-rc.1`, và cân nhắc lộ version ra footer qua `NEXT_PUBLIC_APP_VERSION` để debug prod.

---

## 6. Việc phải verify trong lúc làm

Ba mục V1/V2/V3 của investigation vẫn **chưa đóng** và không block Phase 1–3, nhưng **block Phase 4 hoàn tất**:

- [ ] **V1 — sandbox:** nhúng thật với `sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"`. Qua được → giữ. Bị đẩy sang `/sandbox.php` → bỏ thuộc tính và ghi vào known-issues. Làm **đầu Phase 4**, vì kết quả quyết định `vidsrc-player.tsx` viết thế nào.
- [ ] **V2 — ISP Việt Nam:** test từ Viettel / VNPT / FPT. **Chỉ user làm được.** Nếu bị chặn thì toàn bộ migration này vô nghĩa → nên test **trước khi bắt đầu Phase 4**.
- [ ] **V3 — tỉ lệ phụ đề tiếng Việt:** 30 phim mẫu với `?ds_lang=vi`. Quyết định có cần xây tính năng tự nạp sub qua `sub_url` ngay trong scope này hay không.
- [ ] **V4 — postMessage:** xác nhận chu kỳ ~5s và `player_duration` có sớm không, trước khi viết `useVideoProgress`.
- [ ] **V8 — độ phủ:** đối chiếu 200 title phổ biến từ TMDB với `/ids/movie_tmdb.txt`. Nếu phủ thấp thì phải đổi chiến lược row trang chủ (ưu tiên feed latest của vidsrc thay vì trending TMDB).

---

## 7. Rủi ro còn treo

| # | Rủi ro | Mức | Ghi chú |
|---|---|---|---|
| R1 | V2 thất bại (ISP chặn) sau khi đã code xong | 🔴 | **Giảm thiểu: chạy V2 TRƯỚC Phase 4.** Rẻ, và là điểm chết duy nhất không có đường lui |
| R2 | Độ phủ vidsrc thấp hơn kỳ vọng → browse toàn ô trống | 🟠 | V8 đo trước; dự phòng: trang chủ ưu tiên feed latest vidsrc |
| R3 | TMDB rate limit khi discover + availability check dồn dập | 🟠 | Cache Redis ~30 phút cho response discover; index tra cục bộ |
| R4 | Groq quota khi phải dịch EN→VI cho phim ít phổ biến | 🟠 | Chỉ dịch ở trang detail (không dịch cho card); batch như hiện tại |
| R5 | Mất toàn bộ custom controls Phase 1/2 | 🔴 | Đã chấp nhận. Code còn trong lịch sử git nếu cần khôi phục |
| R6 | `TV_SET`/`TV_INFO` là API không công bố | 🟠 | Luôn có nhánh fallback đổi `iframe.src` |

---

## 8. Thứ tự đề xuất cho buổi tới

1. **V2 trước tiên** (user test từ mạng VN) — nếu fail thì dừng, không tốn công.
2. Phase 1 (còn 4 file: 1.1, 1.5, 1.6, 1.7, 1.8).
3. Phase 2.
4. Phase 3 — phần dài nhất, nên cắt thành 2–3 commit nhỏ.
5. V1 + V4, rồi Phase 4.
6. Phase 5, Phase 6.

---

## 9. Worklog

- **2026-09-20** — Chốt 3 quyết định (D1/D2/D3). Khảo sát repo: 12 endpoint OPhim và consumer của chúng, shape view model, 4 badge component, pipeline ảnh, pipeline dịch, filter bar, card component. Probe TMDB live: genre list movie+tv, detail movie (68721) + tv (1399) kèm `append_to_response`, độ phủ `overview` vi-VN trên 2 title ít phổ biến. Phát hiện `lib/upstash.ts` lệch tên biến môi trường (§2.1). Viết xong 3 file nền (`constants/tmdb-taxonomy.ts`, `lib/media-key.ts`, `types/tmdb-api.ts`) trước khi dừng theo yêu cầu.
