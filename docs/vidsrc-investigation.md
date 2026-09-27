# Investigation Report — vidsrc.sh (embed-only streaming) cho MovieX

> **Status:** Investigation complete — awaiting decision, CHƯA code
> **Owner:** ptduy14
> **Date:** 2026-09-20
> **Phương pháp:** đọc docs `https://vidsrc.sh/vidsrc/docs/` + **probe live toàn bộ endpoint** (curl, 2026-09-20). Mọi số liệu dưới đây là kết quả probe thật, không lấy từ docs — có chỗ docs và thực tế **lệch nhau** (§3.4).
> **Liên quan:** [`vsmov-migration.md`](./vsmov-migration.md) (investigation OPhim → VSMOV/KKPhim, 2026-08-30), [`production-audit.md`](./production-audit.md), [`custom-video-controls.md`](./custom-video-controls.md)

---

## 0. TL;DR

**vidsrc.sh KHÔNG phải là một OPhim thay thế.** Nó giải quyết **đúng một nửa** bài toán: *playback*. Nửa còn lại — catalog, metadata, tìm kiếm, phân loại, poster, mô tả — nó **không cung cấp** (chỉ có feed "mới thêm" 250 item và danh sách ID thô).

Nếu chọn vidsrc, kiến trúc bắt buộc phải là:

```
TMDB (catalog + metadata + ảnh + search)  →  UI của app
vidsrc.sh (iframe embed, key = imdb/tmdb id)  →  playback
Upstash Redis (index ID có sẵn trên vidsrc)  →  lọc "phim nào xem được"
```

Đây **không phải migration nguồn API** như KKPhim — đây là **viết lại tầng dữ liệu + thay toàn bộ player**. Ước tính blast radius ~40–50 file so với ~4 file của KKPhim.

| | Đổi sang **KKPhim (phimapi.com)** | Đổi sang **vidsrc.sh** |
|---|---|---|
| Coverage | 12/12 endpoint | 1/12 (chỉ playback) |
| Catalog VN (Vietsub/Thuyết minh) | ✅ có sẵn | ❌ không có khái niệm |
| Kiểm soát player | ✅ hls.js + custom controls hiện tại | ❌ iframe bên thứ 3, có quảng cáo |
| Quy mô catalog | ~18.8k phim | **95,215 phim / 20,561 series / 508,097 tập** |
| Chất lượng nguồn | 1 rendition, mirror VN | multi-quality, scene release (YTS/YIFY) |
| Effort | ~1 PR nhỏ | 4–6 PR, ~3–4 tuần |
| Rủi ro lớn nhất | mirror free, không SLA | mất kiểm soát UX + ads + anti-devtool |

**Khuyến nghị:** xem §9.

---

## 1. vidsrc.sh cung cấp gì / KHÔNG cung cấp gì

### ✅ Có

| Hạng mục | Chi tiết |
|---|---|
| Embed player | `GET /embed/movie/{imdb\|tmdb}` · `GET /embed/tv/{id}/{season}/{episode}` |
| Không cần API key | Không đăng ký, không token, không rate-limit quan sát được |
| Quy mô catalog | 95,215 movie IDs · 20,561 TV IDs · 508,097 episode IDs (probe 2026-09-20) |
| Multi-quality | Nguồn là scene release (`Iron.Man.3.2013.1080p.BluRay.x264.YIFY.mp4`) |
| Subtitle tự động | Player tự lấy sub từ nhiều provider + track nhúng trong file |
| Subtitle tự host | `?sub_url=` nhận `.vtt/.srt` của mình (fetch **client-side**, host phải có CORS) |
| Player events | `postMessage` → `PLAYER_EVENT` (playing/paused/completed/seeked + progress + duration) |
| Resume | `?startAt={seconds}` |
| Auto next episode | `?autonext=1` |
| Danh sách ID | `/ids/*.txt`, cập nhật hằng ngày, có CORS |
| Feed mới thêm | `/movies|tvshows|episodes/latest/page-N.json` |
| Phim Việt | ✅ **có** — probe 4/4 khớp (§2.3) |

### ❌ Không có

| Thiếu | Hệ quả với app hiện tại |
|---|---|
| **Search** | Trang `/search` mất nguồn |
| **Browse theo thể loại / quốc gia / năm** | `/movies/type/*`, `/movies/country/*`, `/movies/format/*` mất nguồn |
| **Metadata** (mô tả, diễn viên, đạo diễn, thời lượng, poster) | Toàn bộ trang detail + card mất dữ liệu |
| **Full catalog dump có metadata** | Feed "latest" chỉ **250 item** (§3.4) |
| **Khái niệm Vietsub / Thuyết minh / Lồng tiếng** | `server-section`, language switcher, badge `lang` vô nghĩa |
| **`link_m3u8` / stream URL** | Không thể dùng hls.js — iframe là **con đường duy nhất** (§4) |
| **Episode list có tên tập** | Chỉ có số season/episode |
| **SLA / liên hệ / ToS** | Không có |

---

## 2. Probe results

### 2.1 Embed endpoint

```
$ curl -D - https://vidsrc.sh/embed/movie/tt1300854
HTTP/1.1 200 OK
Content-Type: text/html; charset=UTF-8
Cache-Control: public, max-age=300
Server: cloudflare
```

- **Không có `X-Frame-Options`, không có `CSP: frame-ancestors`** → nhúng iframe từ domain mình được, không bị chặn. ✅
- Cache 5 phút ở edge.

### 2.2 Metadata API nội bộ (không có trong docs)

Player gọi `https://data.vidsrc.sh/api.php?type=movie&imdb={id}`:

```json
{"status_code":"200","data":{
  "title":"Iron Man 3 2013",
  "imdb_id":"tt1300854",
  "file_name":"Iron Man 3 (2013) [1080p]/Iron.Man.3.2013.1080p.BluRay.x264.YIFY.mp4",
  "backdrop":"https://image.tmdb.org/t/p/w1280/iVped1djsF0tvGkvnHbzsE3ZPTF.jpg"},
 "default_subs":[],
 "thumbnails_url":"https://vidapi.cloud/static/.../thumbnails.vtt"}
```

Đáng chú ý:
- `backdrop` chính là **ảnh TMDB** → vidsrc cũng đang lấy metadata từ TMDB. Xác nhận: TMDB là nguồn metadata đúng đắn cho phía mình.
- `default_subs: []` trên cả 2 phim probe → **không có sub nào được preload**; sub được resolve lúc play.
- Endpoint này **undocumented** → không được coi là contract, có thể đổi bất cứ lúc nào. Không build phụ thuộc vào nó.

### 2.3 Phim Việt — có trong catalog ✅

Probe bằng cách resolve IMDb id qua Wikidata rồi `grep` trong `/ids/movie_imdb.txt` (95,215 dòng):

| Phim | IMDb | Trong catalog? | File thật |
|---|---|---|---|
| Mai (2024) | `tt31174028` | ✅ | `Mai.2024.1080p.WEBRip.x264.AAC5.1-[YTS.MX].mp4` |
| Nhà Bà Nữ (2023) | `tt26427249` | ✅ | — |
| Bố Già (2021) | `tt13925862` | ✅ | `Bo.Gia.2021.1080p.WEBRip...` |
| Song Lang (2018) | `tt8838810` | ✅ | — |

→ Phim Việt **có tiếng Việt gốc** vì đó là original audio. **Nhưng**: phim ngoại **không có bản thuyết minh / lồng tiếng tiếng Việt**, và phụ đề Việt là best-effort từ provider (không đảm bảo). Đây là khác biệt sản phẩm lớn nhất với OPhim/KKPhim.

### 2.4 Danh sách ID

| File | Số dòng | Format |
|---|---|---|
| `movie_imdb.txt` | **95,215** | `tt1300854` |
| `tv_imdb.txt` | **20,561** | `tt0944947` |
| `eps_imdb.txt` | **508,097** | `tt0944947_1x1` |

Có `movie_tmdb.txt` / `tv_tmdb.txt` / `eps_tmdb.txt` tương ứng. CORS bật, cập nhật hằng ngày.

### 2.5 Feed "latest" — ⚠️ lệch docs

Docs ví dụ `"pages": 1833` và viết *"Walk the whole catalogue by requesting page-1 through page-{pages}"*. Thực tế:

```
$ curl https://vidsrc.sh/movies/latest/page-1.json   → "pages":5
$ curl https://vidsrc.sh/tvshows/latest/page-1.json  → "pages":5
$ curl https://vidsrc.sh/episodes/latest/page-1.json → "pages":5
$ curl https://vidsrc.sh/movies/latest/page-6.json   → {"result":[],"pages":5}
```

→ **Feed chỉ expose 250 item mới nhất mỗi loại.** Không thể duyệt toàn catalog qua feed. Muốn biết catalog đầy đủ **bắt buộc** dùng `/ids/*.txt` (chỉ có ID, không có metadata).

Hệ quả thiết kế: feed `latest` chỉ đủ để làm **một row "Mới cập nhật"** trên trang chủ. Mọi thứ khác phải dựng từ TMDB.

---

## 3. Contract (dùng khi implement)

### 3.1 URL

```
/embed/movie/{imdbId|tmdbId}
/embed/tv/{id}/{season}/{episode}
/embed/tv/{id}/{season}-{episode}
/embed/tv/{id}                       → picker mùa/tập, tự resume tập xem dở
/embed/movie?imdb=tt1300854
/embed/tv?tmdb=1399&season=1&episode=1
```

### 3.2 Query params

| Param | Giá trị | Ghi chú |
|---|---|---|
| `autoplay` | `0/1` | **Autoplay không-cần-click chỉ chạy trên custom domain** (§6). Domain mặc định luôn có nút Play trước |
| `autonext` | `0/1` | TV only, hiện countdown "Up next" |
| `startAt` | float (giây) | Resume |
| `ds_lang` | `en` / `en,fr,de` | Ngôn ngữ sub ưu tiên, tối đa 3 |
| `sub_url` | https URL | `.vtt`/`.srt` của mình. **Fetch bởi browser người xem** → host phải gửi `Access-Control-Allow-Origin` |
| `sub_label` | string | Tên track |
| `sub_lang` | ISO code | |

### 3.3 postMessage — documented

```js
{ type: 'PLAYER_EVENT', data: {
    player_info: { imdb, tmdb, mediaType, season, episode },
    player_status: 'playing' | 'paused' | 'completed' | 'seeked',
    player_progress: 125.4,   // giây
    player_duration: 7200 } }
```

`playing` bắn khi bắt đầu/tiếp tục **và mỗi ~5s trong lúc phát** → đủ để nuôi `useVideoProgress` hiện tại.

### 3.4 postMessage — UNDOCUMENTED (đọc được từ source wrapper)

Wrapper `/embed/...` relay **hai chiều**: message từ page cha được forward xuống player, message từ player forward lên page cha. Ngoài `PLAYER_EVENT` còn có:

| Type | Hướng | Nội dung |
|---|---|---|
| `PLAYER_TITLE` | lên | `{ title }` |
| `TV_INFO` | lên | `{ eps: { "1": [1,2,3...] }, season, episode }` — **danh sách mùa/tập thật** |
| `TV_STATE` | lên | `{ season, episode }` khi đổi tập trong player |
| `PLAYER_UI` | lên | `{ visible }` — controls đang hiện/ẩn |
| `TV_SET` | **xuống** | `{ type:'TV_SET', season, episode }` — **đổi tập không reload iframe** |
| `VS_EXPIRED` | lên | token hết hạn, wrapper tự refresh |
| `VS_DEVTOOLS` | lên | phát hiện devtools (§5.3) |

> `TV_SET` và `TV_INFO` rất giá trị: cho phép app tự render danh sách tập (giữ UI hiện tại) và đổi tập mượt. **Nhưng đây là API không được công bố, không có cam kết** — phải code phòng thủ (fallback = đổi `iframe.src`).

---

## 4. Kiến trúc player thật (quan trọng cho quyết định)

Trace từ HTML thật:

```
[ page của mình ]
  └─ iframe → https://vidsrc.sh/embed/movie/tt1300854        ← wrapper, cache 300s
       ├─ sbx.js                                              ← chặn iframe sandbox (§5.1)
       ├─ fetch /vs_src.php?type=movie&id=...                 ← trả gate token ngắn hạn
       └─ iframe → https://cloudorchestranova.com/embed/...?vs=<token>
            ├─ data.vidsrc.sh/api.php  → title + backdrop
            ├─ disable-devtool.js                             ← §5.3
            └─ iframe → /embed/player/movie/...?vs=<token>    ← player thật
                 ├─ <video> + UI kiểu JW (seek, thumbnails, CC, volume…)
                 └─ document.write('/embed/<md5>.js')         ← 640 KB obfuscated (§5.2)
```

**Ba tầng iframe, domain trung gian đổi được bất cứ lúc nào** (`cloudorchestranova.com` hôm nay, mai khác). Stream URL nằm sau gate token host-bound → **không có cách lấy m3u8 hợp lệ**. Embed là đường duy nhất; điều này là *by design*, không phải thiếu sót docs.

---

## 5. Rủi ro kỹ thuật & bảo mật (findings từ source, không phải suy đoán)

### 5.1 🔴 Họ **chặn** `<iframe sandbox>`

`https://vidsrc.sh/assets/sbx.js`, nguyên văn comment của họ:

> *"Sandbox-embed blocker … If that page is loaded inside an `<iframe sandbox>` (a client trying to cage the player), this frame is redirected to `/sandbox.php`"*

Detect 2 cách: (1) `window.frameElement.hasAttribute('sandbox')`, (2) origin opaque → `document.domain = document.domain` throw lỗi chứa `"sandbox"`.

**Ý nghĩa:** hàng rào tiêu chuẩn để chặn popunder/redirect của iframe bên thứ 3 **bị vô hiệu hoá có chủ ý**.

**Khe hở khả dĩ (chưa verify, phải test thật):** `sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"` — có `allow-same-origin` nên origin **không** opaque (qua được check 2), và `frameElement` là null vì cross-origin (qua được check 1), trong khi vẫn **thiếu `allow-popups` và `allow-top-navigation`** → vẫn chặn được popunder + hijack tab. Đây là mitigation đáng thử **trước khi quyết**; nếu họ siết, coi như không có phòng tuyến. → **V1** trong checklist.

### 5.2 🟠 640 KB script obfuscated trong player frame

```html
<script>document.write("<script src='/embed/f59d610a61063c7ef3ccdc1fd40d2ae6.js?_=...'><\/script>");</script>
```

639,789 bytes, toàn bộ URL bị mã hoá (`grep` không ra một host nào) — mẫu điển hình của loader quảng cáo / anti-adblock / popunder. Docs của chính họ xác nhận gián tiếp: custom domain được *"50% fewer ads"* → **domain mặc định có ads**, và ads nằm **trong** khung player.

Script này chạy trong origin của họ, không đụng được DOM của mình, nhưng **có thể mở popup/redirect** nếu không sandbox được (§5.1).

### 5.3 🟠 Anti-devtool tự huỷ player

```js
DisableDevtool({ disableMenu: true, clearLog: true, disableIframeParents: true,
                 ondevtoolopen: kill });
// kill(): pause video, xoá src, postMessage VS_DEVTOOLS lên cha, location.replace('about:blank')
```

Người dùng mở DevTools (hoặc F12 vô tình) → **player tự chết**. Chuột phải trong khung player bị khoá. Với một sản phẩm có người dùng thật, đây là UX hostile mà mình **không kiểm soát và không tắt được**.

### 5.4 🟠 Histats tracking chạy trên wrapper

Wrapper nhúng `histats.com` counter. Mọi lượt xem của user mình được đếm bởi bên thứ ba. Không rò dữ liệu app (cross-origin), nhưng là một analytics endpoint ngoài tầm kiểm soát — lưu ý với PostHog/GDPR-style disclosure đang có trong `components/disclaimer`.

### 5.5 🔴 Custom domain = bẫy SSL, KHÔNG dùng zone chính

Docs yêu cầu: CNAME `@` (root domain) → `vidsrc-ip.com`, và **SSL mode phải là `Flexible`**, *"Do not use Full or Full (strict) — the connection to VidSrc's origin must remain on HTTP."*

- `Flexible` là **setting cấp zone** trên Cloudflare → nếu dùng chính domain của MovieX, **toàn bộ traffic Cloudflare → Vercel tụt xuống HTTP**, phá vỡ end-to-end TLS của cả app.
- CNAME ở root nghĩa là **trỏ cả domain**, không phải một subdomain lẻ.
- Domain của mình sẽ **trực tiếp phục vụ nội dung vi phạm bản quyền** → rủi ro Safe Browsing/blocklist và DMCA đứng tên domain mình.

**Nếu vẫn muốn quyền lợi custom domain (ít ads 50%, bỏ logo, autoplay thẳng): bắt buộc dùng một domain/zone RIÊNG, rẻ, tách hoàn toàn khỏi zone của app.** Không bao giờ đụng zone chính.

### 5.6 🟠 Reachability từ Việt Nam — chưa verify

Probe của tôi đi từ datacenter ngoài VN. `vidsrc.sh` + `cloudorchestranova.com` + `vidapi.cloud` là cụm domain streaming lậu → khả năng bị ISP VN chặn DNS là **thật** (đã xảy ra với nhiều domain cùng loại). Player chết vì DNS block thì **không có fallback nào**, vì không có m3u8.
→ **V2**: user test từ Viettel/VNPT/FPT trước khi chốt.

---

## 6. Gap analysis — app hiện tại vs vidsrc

| Thành phần hiện tại | File | Số phận với vidsrc |
|---|---|---|
| `services/movie-services.ts` (12 endpoint OPhim) | 1 file | **Xoá/viết lại** → `services/tmdb-catalog-service.ts` |
| Types `newly-movie`, `movie`, `detail-movie`, `episode`, `home-response` | 5 file | **Viết lại** theo shape TMDB |
| `components/watch/video-player.tsx` (hls.js) | 1 file | **Thay bằng `<iframe>`** |
| `components/watch/video-controls/**` (Phase 1+2, 12 file) | 12 file | ☠️ **Chết toàn bộ** — controls nằm trong iframe của họ |
| `hls.js` dependency | package.json | Gỡ được |
| `hooks/useVideoProgress.ts` | 1 file | **Viết lại** quanh `postMessage` (không còn `videoRef`) |
| `hooks/useWatchAnalytics.ts` | 1 file | **Viết lại** tương tự |
| `components/watch/server-section.tsx` + language switcher | 2 file | ☠️ Không còn khái niệm server/Vietsub/Thuyết minh |
| Resume prompt `progress-watch-notification` | 1 file | Giữ UI, nhưng "accept" = **remount iframe với `?startAt=`** (không seek runtime được) |
| Groq translation pipeline + Firestore `translations` + cron | ~6 file + ops | **Có thể xoá** nếu dùng TMDB `language=vi-VN`… nhưng TMDB trả `overview: ""` khi chưa có bản dịch → **giữ Groq làm fallback** là lựa chọn tốt hơn |
| Routing `/movies/[slug]` (slug OPhim) | 4 route | **Đổi key** → `ten-phim-{tmdbId}`. Mọi link cũ chết |
| Firestore `recentMovies`, comments, collections (key = `_id` OPhim) | data | **Orphan 100%**. Mặt tốt: key mới (tmdb/imdb id) là **định danh toàn cầu ổn định**, không còn phụ thuộc mirror |
| Image pipeline `img.ophim.live` | `app/api/image`, `next.config.mjs` | Đổi sang `image.tmdb.org` |
| `CATEGORY_MAP` / `COUNTRY_MAP` / `data/move-format.ts` | 3 file | **Viết lại** theo TMDB genre id + ISO country |
| Badge `quality` / `lang` / `episode_current` | card components | TMDB không có. `quality` chỉ có cho 250 item trong feed latest |
| Custom subtitle upload (chưa merge vào `main`) | — | vidsrc có `sub_url` **native** → feature này rẻ hơn hẳn, nhưng file phải host ở nơi có CORS |

**Ước tính:** ~40–50 file chạm tới, 4–6 PR, 3–4 tuần cho một người.

---

## 7. Kiến trúc đề xuất nếu chọn vidsrc

### 7.1 Ba tầng

```
TMDB  → catalog, search (/search/multi), discover (/discover/movie|tv),
        genre, country, credits, poster/backdrop, overview vi-VN
         ↓ (tmdb_id / imdb_id)
Availability index (Upstash Redis)
        ← cron hằng ngày tải /ids/*.txt, nạp thành SET
         ↓
vidsrc.sh /embed/...  → iframe playback
```

### 7.2 Availability index — chi tiết

Vấn đề: TMDB có ~1 triệu phim, vidsrc chỉ có 95k. Không lọc thì user click vào phim → player báo "This media is unavailable".

Hai phương án:

| | Upstash Redis SET | Bloom filter tĩnh |
|---|---|---|
| Cách làm | Cron hằng ngày `SADD vs:movie <95k ids>` | Build-time sinh bloom filter, ship trong bundle |
| Tra cứu | `SISMEMBER` server-side, 1 round-trip | Client-side, 0 network |
| Dung lượng | ~3–5 MB trong Redis | ~140 KB cho 116k item @ 1% false-positive |
| Chính xác | 100% | ~1% false positive (hiện phim rồi báo lỗi) |
| Ghi chú | Upstash đã là dependency sẵn (`lib/upstash.ts`) | Cần rebuild/redeploy để cập nhật |

→ Khuyến nghị **Redis SET** cho movie+tv (115k member, rẻ), **bỏ qua** episode-level (508k) — cứ để player tự báo tập thiếu.

### 7.3 Player component

```
<iframe
  src={`https://vidsrc.sh/embed/movie/${imdbId}?ds_lang=vi,en${startAt ? `&startAt=${startAt}` : ''}`}
  allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
  allowFullScreen
  referrerPolicy="origin"
  sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"  // ← V1: phải test
/>
```

+ `window.addEventListener('message', …)` lọc `PLAYER_EVENT` → nuôi progress/analytics hiện có.
+ Lưu ý: **`sub_url` phải là https + CORS**; nếu tự host sub trên Vercel thì phải set header.

### 7.4 Hybrid (đáng cân nhắc nhất — xem §9)

Không phải chọn một. `KKPhim làm nguồn chính` + `vidsrc làm fallback`:

- Catalog/metadata/UI/player: giữ nguyên KKPhim + hls.js + custom controls đã build.
- Khi phim **không có trên KKPhim** (phim Âu Mỹ mới, series dài, phim cũ) → dùng `tmdb.id` sẵn có trong item để mở vidsrc iframe như một "server phụ".
- `server-section` hiện tại vốn đã là UI chọn server → thêm entry `"Server ngoài (Phụ đề)"` là **khớp mô hình sẵn có**, không phá kiến trúc.
- Chi phí: 1 component iframe + 1 nhánh trong watch page. **Vài trăm dòng, không phải 40 file.**

---

## 8. Risk register

| # | Rủi ro | Mức | Mitigation |
|---|---|---|---|
| R1 | Không sandbox được iframe → popunder/redirect từ ad layer | 🔴 High | Test `allow-same-origin` sandbox (§5.1 / V1). Không qua → cân nhắc bỏ |
| R2 | ISP Việt Nam chặn DNS cụm domain vidsrc → player chết, **không fallback** | 🔴 High | V2 verify từ 3 ISP; hybrid (§7.4) cho fallback thật |
| R3 | Mất toàn bộ custom video controls (Phase 1+2 đã build) + hls.js | 🔴 High | Chấp nhận, hoặc hybrid giữ lại cho nguồn chính |
| R4 | Không có Vietsub/thuyết minh đảm bảo cho phim ngoại — **thay đổi bản chất sản phẩm với user VN** | 🔴 High | `ds_lang=vi,en`; `sub_url` để tự nạp sub Việt; đo tỉ lệ có sub Việt trên 30 phim (V3) |
| R5 | Domain trung gian (`cloudorchestranova.com`) đổi bất kỳ lúc nào; contract chỉ là HTML | 🟠 Med | Chỉ phụ thuộc `vidsrc.sh/embed/*` (mặt ngoài ổn định), không hardcode domain trong |
| R6 | `TV_SET`/`TV_INFO` undocumented, có thể mất | 🟠 Med | Code phòng thủ + fallback đổi `iframe.src` |
| R7 | Anti-devtool tự huỷ player khi user mở F12 | 🟠 Med | Không kiểm soát được. Ghi vào known-issues |
| R8 | Custom domain ⇒ SSL Flexible cấp zone + domain mình phục vụ nội dung lậu | 🔴 High | **Chỉ dùng domain/zone riêng**, không bao giờ zone chính (§5.5) |
| R9 | Toàn bộ history/comment/collection cũ orphan | 🟡 Low | Chấp nhận (site đang maintenance, data cũ vốn đã hỏng theo OPhim) |
| R10 | TMDB `vi-VN` trả `overview: ""` cho phim ít phổ biến | 🟡 Low | Giữ Groq pipeline làm fallback dịch |
| R11 | TMDB rate limit + latency cho mọi trang browse | 🟡 Low | Đã có Upstash; thêm cache layer ~30p |

---

## 9. So sánh & khuyến nghị

### Ba đường

| | A. KKPhim (phimapi.com) | B. vidsrc.sh toàn phần | C. **Hybrid: KKPhim chính + vidsrc fallback** |
|---|---|---|---|
| Effort | ~1 PR | 4–6 PR / 3–4 tuần | ~1 PR (A) + ~1 PR nhỏ |
| Catalog | 18.8k, VN-first | 95k+20k, global | 18.8k + 95k phủ chồng |
| Vietsub/Thuyết minh | ✅ | ❌ | ✅ nguồn chính, ❌ fallback |
| Custom player (đã build) | ✅ giữ | ☠️ mất | ✅ giữ cho nguồn chính |
| Ads / anti-devtool | không | có | chỉ khi dùng fallback |
| Chống nguồn chết | ❌ single point | ❌ single point | ✅ **hai nguồn độc lập** |
| Kiểm soát | cao | thấp | cao |

`phimapi.com` **vẫn sống**: probe 2026-09-20 → `GET /v1/api/home?page=1` = **200**. `ophim1.com` = **404** (đã chết hẳn, xác nhận lại).

### Khuyến nghị

> **Đi đường C (Hybrid).** Thực hiện migration KKPhim đã được phân tích và khuyến nghị trong [`vsmov-migration.md §20.4`](./vsmov-migration.md) trước — nó khôi phục site trong 1 PR và trả lại đúng sản phẩm mà user VN đang dùng (Vietsub, thuyết minh, custom player). Sau đó gắn vidsrc như **server phụ** qua `tmdb.id` đã có sẵn trong mọi item.

Lý do không chọn B (vidsrc toàn phần):
1. Đánh đổi **toàn bộ** kiểm soát player (controls, ads, anti-devtool) lấy catalog lớn hơn — trong khi user VN cần Vietsub/thuyết minh hơn cần 95k phim Âu Mỹ.
2. Vẫn là **single point of failure**, chỉ đổi chỗ. Nếu vidsrc chết, mất luôn cả catalog lẫn playback (còn KKPhim chết thì ít nhất vẫn có TMDB metadata).
3. R2 (ISP chặn) chưa được kiểm chứng và **không có plan B** nếu xảy ra.
4. 3–4 tuần rewrite để đạt trạng thái *kém kiểm soát hơn hiện tại*.

Nhưng vidsrc **rất đáng giá** như tầng thứ hai: nó lấp đúng lỗ hổng lớn nhất của các mirror VN (phim Âu Mỹ mới, series dài, phim cũ), chi phí vài trăm dòng, và không đụng vào kiến trúc đang có.

**Nếu vẫn muốn đi B toàn phần** → bắt buộc đóng V1 + V2 + V3 (§11) **trước khi** viết dòng code đầu tiên.

---

## 10. Versioning cho FE

Hiện tại `package.json` = `"version": "0.1.0"`, **chưa từng được bump**, không hiển thị ở đâu trong UI, không có CHANGELOG, không có git tag.

Đề xuất — làm đúng một lần cho ra tấm ra món:

| Bước | Việc |
|---|---|
| 1 | Thêm `CHANGELOG.md` (Keep a Changelog format) |
| 2 | Bump version theo **đường đã chọn** (bảng dưới) |
| 3 | `git tag v<version>` + GitHub Release |
| 4 | (tuỳ chọn) Expose version trong footer qua `NEXT_PUBLIC_APP_VERSION` để debug prod |

| Đường đi | Version đề xuất | Lý do |
|---|---|---|
| A — KKPhim | `0.2.0` | Đổi nguồn dữ liệu, breaking ở tầng data nhưng UX không đổi. Vẫn pre-1.0 |
| C — Hybrid | `0.3.0` | A + thêm nguồn phát mới |
| B — vidsrc toàn phần | `1.0.0` | Viết lại data layer + player layer = sản phẩm khác về bản chất → xứng đáng mốc 1.0 |

⚠️ Lưu ý: gắn nhãn `1.0.0` ngụ ý "production-ready". [`production-audit.md`](./production-audit.md) đang có **blocker CRITICAL về bảo mật chưa đóng**. Nên đóng các blocker đó trước khi public tag `1.0.0`, hoặc tag `1.0.0-rc.1` cho tới khi sạch.

---

## 11. Verification checklist (chạy TRƯỚC khi chốt phương án B hoặc C)

- [ ] **V1 — sandbox:** nhúng `/embed/movie/tt1300854` với `sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"`. Player chạy bình thường hay bị đẩy sang `/sandbox.php`? Nếu chạy → click 20 lần trong khung player, đếm popup/redirect thoát ra được.
- [ ] **V2 — reachability VN:** mở `https://vidsrc.sh/embed/movie/tt1300854` từ Viettel / VNPT / FPT (cả mobile data). Có DNS block không? Đo cả `cloudorchestranova.com` và `vidapi.cloud`.
- [ ] **V3 — phụ đề tiếng Việt:** lấy 30 phim ngẫu nhiên (10 blockbuster, 10 indie, 10 series), mở với `?ds_lang=vi` → đếm tỉ lệ có track tiếng Việt. Đây là con số quyết định sản phẩm.
- [ ] **V4 — postMessage thật:** log `PLAYER_EVENT` 10 phút liên tục; xác nhận chu kỳ ~5s, `player_duration` có sớm không, `completed` có bắn không.
- [ ] **V5 — `TV_SET`:** gửi từ page cha, xem có đổi tập không reload không.
- [ ] **V6 — `startAt`:** kiểm độ chính xác resume (±?s) và hành vi khi `startAt` > duration.
- [ ] **V7 — `sub_url`:** host 1 file `.vtt` trên Vercel với `Access-Control-Allow-Origin: *`, verify player nạp được.
- [ ] **V8 — availability index:** đối chiếu 200 title phổ biến từ TMDB với `/ids/movie_tmdb.txt` → đo tỉ lệ phủ thực tế.
- [ ] **V9 — mobile:** iOS Safari + Android Chrome: fullscreen, xoay ngang, autoplay-muted fallback. App hiện có logic `mobile-fullscreen` riêng — trong iframe **mình không điều khiển được nữa**.
- [ ] **V10 — ổn định:** probe `/embed/*` mỗi giờ trong 48h, đo uptime + có đổi domain trung gian không.

---

## 12. Decision points

| # | Câu hỏi | Khuyến nghị |
|---|---|---|
| D1 | A, B hay C? | **C (Hybrid)** — §9 |
| D2 | Có dùng custom domain của vidsrc không? | **Không** cho zone chính. Chỉ nếu mua domain rác riêng (§5.5) |
| D3 | Availability index: Redis hay Bloom? | **Redis SET**, movie+tv, bỏ episode (§7.2) |
| D4 | Giữ hay bỏ Groq translation pipeline? | **Giữ** làm fallback khi TMDB `vi-VN` rỗng (R10) |
| D5 | Version bump | Theo bảng §10, kèm CHANGELOG + git tag |
| D6 | Custom subtitle feature (chưa merge) | Nếu đi B/C: dùng `sub_url` native của vidsrc thay vì parser client-side tự viết |

---

## 13. Worklog

- **2026-09-20** — Đọc docs `vidsrc.sh/vidsrc/docs/`; probe live: embed headers (không XFO/CSP), feed latest 3 loại (**pages=5, lệch docs**), ID lists (95,215 / 20,561 / 508,097 dòng), `data.vidsrc.sh/api.php`, trace 3 tầng iframe + gate token `vs_src.php`, đọc `sbx.js` (**sandbox blocker**), `disable-devtool` config, 640KB obfuscated ad loader, Histats. Đối chiếu 4 phim Việt qua Wikidata → **4/4 có trong catalog**. Re-probe `phimapi.com` = 200, `ophim1.com` = 404. Khảo sát blast radius trong repo (12 endpoint OPhim, 12 file custom controls, 5 type file, routing slug-based).
