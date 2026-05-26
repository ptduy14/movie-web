# Custom Video Controls — Design Doc

> Replace the default browser `<video controls>` UI with a fully custom, brand-consistent player overlay. Goal: visual parity across browsers, premium UX comparable to Netflix / Apple TV+ / Prime Video, and room to add advanced features within the constraints of the OPhim data source.

**Status:** proposed (decisions locked — see §0)
**Owner:** _(unassigned)_
**Last updated:** 2026-05-22

---

## 0. Decisions locked

| Question | Answer |
|---|---|
| Build vs library | **Build custom from scratch** — full control, no dead weight |
| Mobile priority | **First-class** — responsive 16:9, gestures (tap, double-tap-seek, swipe seek/volume, pinch fullscreen) |
| Skip Intro / Outro | **Dropped** — no markers in OPhim data, manual annotation not in scope |
| Next-episode auto-play card | **Yes** — derives from `duration - currentTime`, no extra data needed |
| Quality selector | **Dropped** — OPhim manifests have a single quality level (verified across 4 sample movies) |
| Subtitle track switcher | **Dropped** — OPhim hard-burns subtitles into the video stream; sub language is a server switch, not a track switch |
| Custom subtitle styling | **Dropped** — same reason; nothing to style |
| Multi-audio track switch | **Dropped** — audio variants are exposed as separate servers, not as HLS `AUDIO` groups |
| Server selector placement | **Move into player overlay** — frame it as "Audio / Language" menu, since servers ARE the language variants in OPhim |

---

## 1. Problem statement

The current watch page renders a plain HTML5 video tag with the native `controls` attribute:

```tsx
// components/watch/video-player.tsx:92
<video ref={videoRef} controls style={{ width: '100%', height: '100%' }} />
```

This means:

| Issue | Impact |
|---|---|
| Chrome / Firefox / Safari / Edge render different control bars | UI feels inconsistent and "off-brand" — clashes with the rest of the dark, red-accent theme |
| No control over fonts, spacing, colors, icons | Cannot match the design system (`#e10711` red accent, dark surfaces) |
| Server selector (language) is detached from the player | User switches "Vietsub" vs "Thuyết Minh" via a button row below the video — not how Netflix/Prime do it |
| Keyboard shortcuts limited to browser defaults | No `J/K/L`, no `<` `>` for speed, etc. |
| Mobile UX is browser-controlled | Cannot show custom tap-to-seek zones, swipe gestures, or a lock screen |
| Fixed `h-[34rem]` (~544px) layout is not responsive | Player crops awkwardly on mobile and ultra-wide; should be 16:9 responsive |
| Analytics granularity is limited | Cannot easily distinguish "user paused" vs "buffering" vs "seek bar drag" |

---

## 2. Goals & non-goals

### Goals
1. **Visual parity** across Chromium, Firefox, Safari, mobile WebViews.
2. **Brand consistency** — controls follow the existing dark theme + `custome-red` (#e10711) accent.
3. **Mobile first-class** — responsive 16:9, tap-to-toggle, double-tap-seek-10s, swipe to seek, swipe to volume, pinch to fullscreen, lock screen.
4. **Feature set realistic for OPhim data**: play/pause, scrubber with buffered + hover thumbnails, volume, fullscreen, PiP, playback speed, in-player **audio/language menu** (server switch), next-episode card, keyboard shortcuts.
5. **Accessibility** — full keyboard control, ARIA labels, focus-visible rings, respects `prefers-reduced-motion`.
6. **Performance** — controls layer must not cause re-renders of the `<video>` element (preserve current HLS behavior).
7. **No regression** of [useVideoProgress](../hooks/useVideoProgress.ts) and [useWatchAnalytics](../hooks/useWatchAnalytics.ts) — both attach to `videoRef` via DOM events.

### Non-goals
- Generic / reusable player.
- DRM / Widevine support (OPhim streams aren't DRM-protected).
- Live streaming UI (DVR rewind, "LIVE" badge). All content is VOD.
- Skip Intro / Outro (no marker data).
- Quality / subtitle / multi-audio menus (OPhim limitation — see §15).
- Chromecast / AirPlay (deferred to future).
- Watch-party / co-watch sync.

---

## 3. Current state — file map

| File | Lines | Role |
|---|---|---|
| [components/watch/video-player.tsx](../components/watch/video-player.tsx) | 114 | Renders `<video controls>` + HLS init + overlay/thumbnail |
| [components/watch/index.tsx](../components/watch/index.tsx) | 126 | Orchestrates: server/episode selection, holds `videoRef`, mounts the hooks |
| [components/watch/server-section.tsx](../components/watch/server-section.tsx) | 20 | Server picker (button grid) — **will be moved into the player overlay** |
| [hooks/useVideoProgress.ts](../hooks/useVideoProgress.ts) | 316 | Resume + 20s/60s save cadence + `sendBeacon` — must not regress |
| [hooks/useWatchAnalytics.ts](../hooks/useWatchAnalytics.ts) | 79 | Milestone events (25/50/75/95%) — must keep firing |
| [tailwind.config.ts](../tailwind.config.ts) | 21 | Only `custome-red: #e10711` + one shadow |
| [app/globals.css](../app/globals.css) | 59 | Container utilities + scrollbar — no design tokens yet |

**Important constraint:** `useVideoProgress` and `useWatchAnalytics` listen on the `<video>` element via `videoRef`. Any refactor must keep the same `HTMLVideoElement` ref intact — don't wrap or proxy the element.

---

## 4. Proposed architecture

### 4.1 Component tree

```
<VideoPlayer>                            ← keeps HLS init; renders <video> WITHOUT `controls`
  <video ref={videoRef} />               ← native element, hidden default UI
  <VideoControlsOverlay>                 ← new — absolute-positioned over the video
    <TopBar>                             ← title, episode #, back, settings gear
    <CenterControls>                     ← big play/pause when paused, ±10s skip buttons (mobile-prominent)
    <BottomBar>
      <ProgressBar>                      ← scrubber + buffered + hover preview thumb
      <LeftCluster>                      ← play/pause, skip ±10, volume, time display
      <RightCluster>                     ← speed, audio/language, PiP, fullscreen
    </BottomBar>
    <BufferingSpinner />                 ← shown on `waiting`
    <NextEpisodeCard />                  ← contextual; ~30s before end
    <LockScreenButton />                 ← mobile only
    <SettingsMenu />                     ← slide-up panel: Speed, Audio/Language, Auto-play next
    <KeyboardShortcutHint />             ← small toast on first interaction
  </VideoControlsOverlay>
</VideoPlayer>
```

### 4.2 State model

Co-locate player state in a single `usePlayerState(videoRef)` hook that:
- Subscribes to video element events: `play`, `pause`, `timeupdate`, `volumechange`, `ratechange`, `waiting`, `playing`, `seeking`, `seeked`, `ended`, `loadedmetadata`, `progress`.
- Returns derived state: `{ isPlaying, currentTime, duration, buffered, volume, muted, playbackRate, isBuffering, isSeeking, isEnded }`.
- Exposes imperative actions: `{ play, pause, toggle, seek(t), seekBy(±s), setVolume, mute, setRate, ... }`.

UI-only state (controls visibility, scrubber hover position, settings menu open, lock-screen active) stays as local `useState` in the overlay — never on the video element.

A small `<PlayerContext>` provider scoped **inside** `VideoPlayer` exposes `{ state, actions, videoRef, server, episode, onServerChange, onEpisodeChange }` to descendants. **Not** a global context — lives and dies with the player instance.

### 4.3 Where HLS lives

`Hls` instance stays exactly where it is in [video-player.tsx](../components/watch/video-player.tsx#L22). The controls overlay never touches HLS directly — it only reads/writes the video element.

### 4.4 Responsive layout

Replace `h-[34rem]` with a 16:9 aspect-ratio container:

```tsx
<div className="relative w-full aspect-video bg-black">
  <video className="absolute inset-0 w-full h-full" ... />
  <VideoControlsOverlay />
</div>
```

On fullscreen, the container's aspect ratio is overridden by the browser's fullscreen layout.

---

## 5. Design system additions

Tailwind config is currently bare. The player is the first proper set of tokens. Suggested additions to `tailwind.config.ts`:

```ts
colors: {
  brand: {
    DEFAULT: '#e10711',              // existing custome-red, renamed
    hover: '#ff1a25',
    muted: 'rgba(225, 7, 17, 0.15)',
  },
  surface: {
    overlay:   'rgba(0, 0, 0, 0.6)', // controls bg gradient base
    chip:      'rgba(255, 255, 255, 0.12)',
    chipHover: 'rgba(255, 255, 255, 0.2)',
  },
  ink: {
    primary:   '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    disabled:  'rgba(255, 255, 255, 0.35)',
  },
},
transitionTimingFunction: {
  'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',  // Netflix-like easing
},
```

Reference visual language (study, don't copy):
- **Netflix:** bottom gradient `linear-gradient(to top, rgba(0,0,0,0.7), transparent)`, controls fade out after 3s idle, big centered play, prominent next-episode card.
- **Apple TV+:** ultra-thin scrubber until hover → expands; subtle "now playing" title in top-left during fade-in.
- **Prime Video:** very prominent forward/back ±10s skip buttons.
- **YouTube:** hover preview thumbnails on scrubber.

---

## 6. Core controls (must-have, Phase 1)

| Control | Behavior | Notes |
|---|---|---|
| Play / pause toggle | Center big button when paused; bottom-left icon when playing | Tap anywhere on video also toggles |
| Scrubber | Click to seek; drag to scrub; shows buffered ranges; hover shows time tooltip | Use the `buffered` TimeRanges API |
| Time display | `mm:ss / mm:ss` (or `h:mm:ss` if >1h) | Click toggles remaining vs elapsed |
| Volume slider + mute | Vertical popover on hover (desktop); muted state persisted to localStorage | Mobile: hide slider; only mute icon (system volume rules) |
| Fullscreen | Standard Fullscreen API + iOS `webkitEnterFullscreen` fallback | iOS Safari needs the native fullscreen path |
| Buffering spinner | Show on `waiting`, hide on `playing` | Debounce 200ms to avoid flicker |
| Auto-hide controls | Hide after 3s of mouse idle while playing; show on mousemove / touch / focus | Never hide while paused or while a control has focus |
| Title bar | Movie name + episode number in top-left during fade-in | Read from `movie.movie.name` + `episodeIndex` |
| Responsive 16:9 | Container is `aspect-video`, not `h-[34rem]` | Works from mobile portrait → desktop ultra-wide |

---

## 7. Premium features (tiered, scoped to OPhim's reality)

### Tier A — high impact, low complexity (Phase 1 stretch / Phase 2 base)
- **±10s skip buttons** with circular sweep animation (Apple TV style). Prominent on mobile.
- **Playback speed** menu: 0.5 / 0.75 / 1 / 1.25 / 1.5 / 2. Persist to localStorage.
- **Keyboard shortcuts** — see §8.
- **Picture-in-Picture** button (`video.requestPictureInPicture()`).
- **Double-click to fullscreen** on the video surface (desktop).
- **Mobile double-tap to seek** — left half = −10s, right half = +10s, with ripple animation.
- **Persist volume, mute, speed** across sessions (localStorage).

### Tier B — medium effort, very visible (Phase 2)
- **Audio / Language menu** (in-player) — repurposes the existing OPhim server selector. Settings gear opens a slide-up panel; user picks "Vietsub" vs "Thuyết Minh". On select, calls `onServerChange(index)` which is already wired in [components/watch/index.tsx](../components/watch/index.tsx#L57). This is the natural home for it — users currently have to scroll below the video to switch language, which is ugly UX.
- **Next-episode card.** ~25–30s before `duration - currentTime`, show a bottom-right card with the next episode poster + countdown + "Play Now" button. Auto-advance on countdown end (toggleable in settings, persisted).
- **Resume snackbar relocation** — already implemented via [ProgresswatchNotification](../components/watch/progress-watch-notification.tsx) — restyle to appear *inside* the player overlay top-center, not above it.
- **Settings menu** — single gear icon opens a slide-up panel: Speed → Audio/Language → Auto-play next.
- **Mobile gestures**:
  - Swipe horizontal on video surface → scrub (with HUD showing target time)
  - Swipe vertical on right half → volume
  - Swipe vertical on left half → brightness (via CSS `filter: brightness()` on a video overlay since real device brightness is not web-accessible)
  - Pinch out → fullscreen
- **Lock screen** (mobile only) — small lock icon in top-right while fullscreen; tapping locks all touch input except the unlock button. Prevents accidental scrubs in pocket / while lying down.

### Tier C — wow factor, higher effort (Phase 3)
- **Hover scrub preview thumbnails.** Generate sprite sheets via `ffmpeg` at a separate ingest pipeline (one tiny JPG per 5–10s). Overlay on scrubber hover. Storyboard format: WebVTT thumbnail track is the standard. **Requires backend work** — see §12.
- **Stats for nerds** — debug overlay with bitrate, dropped frames, buffer health, current CDN edge. Toggle via `Ctrl+Shift+D` or a hidden gesture. Useful for support tickets.
- **Ambient mode** (desktop only) — sample dominant frame colors at ~1Hz with `<canvas>`, bleed them as a glow behind the player (YouTube cinematic mode). Pure CSS + low-frequency color sampling.
- **Reduced-motion mode** — kill all sweep/ripple animations when `prefers-reduced-motion: reduce`.
- **PostHog events** — quality changes (n/a — see §15), speed changes, server (language) switches via the in-player menu, captions toggle (n/a), fullscreen, PiP. Useful product signals.

### Deferred indefinitely
- Chromecast / AirPlay.
- Watch-party / co-watch.
- Skip Intro / Outro (no OPhim markers).
- Quality selector, subtitle track switcher, custom subtitle styling, multi-audio in-stream switch (impossible with OPhim — see §15).

---

## 8. Keyboard shortcuts

Ship in Phase 1:

| Key | Action |
|---|---|
| `Space` / `K` | Toggle play/pause |
| `J` | Back 10s |
| `L` | Forward 10s |
| `←` / `→` | Back / forward 5s |
| `↑` / `↓` | Volume +5 / −5 |
| `M` | Mute toggle |
| `F` | Fullscreen toggle |
| `<` / `>` | Speed down / up (0.25 step) |
| `0`–`9` | Jump to 0%–90% |
| `P` | PiP toggle |
| `N` | Next episode |
| `?` | Show shortcut help overlay |

> `C` (captions) intentionally omitted — OPhim hard-burns subtitles, nothing to toggle.

Implementation: a single `useKeyboardShortcuts(playerActions)` hook attached to `window`, but only active while the player is in the viewport (`IntersectionObserver`) and no form input is focused (`document.activeElement?.tagName !== 'INPUT'`).

---

## 9. Build vs. library — decision: custom

OPhim's data model is simple (single quality, no real subtitle/audio tracks). The fancy features that justify a heavyweight library (DRM, multi-bitrate, chapter UI, native multi-track) are **out of scope**. Building custom is the correct call.

| Option | Verdict |
|---|---|
| **Custom from scratch** | ✅ **Chosen.** ~12 new components, ~600 LOC for Phase 1. ~1.5–2 weeks of effort. |
| Media Chrome | Considered. Reasonable foundation, but the slot-based composition adds learning curve for zero feature payoff given OPhim's limits. |
| Vidstack | Would ship faster but most of its premium features (chapters, thumbnails, DRM) sit unused. |
| Plyr / Video.js | Skip. |

**Escape hatch:** if a future data source replaces OPhim and brings multi-quality / real subtitle tracks / chapters, revisit Media Chrome as a foundation — it composes cleanly with hls.js.

---

## 10. Phased roadmap

### Phase 1 — "feature parity + brand consistency" (~1 week)
- Strip `controls` from `<video>`; switch container to 16:9 `aspect-video`.
- Build `VideoControlsOverlay` shell + `usePlayerState` hook + `PlayerContext`.
- Ship: play/pause, scrubber with buffered, time display, volume, mute, fullscreen, buffering spinner, auto-hide, ±10s skip, keyboard shortcuts, title bar.
- Mobile: tap-toggle, double-tap-seek, responsive layout.
- Verify [useVideoProgress](../hooks/useVideoProgress.ts) and [useWatchAnalytics](../hooks/useWatchAnalytics.ts) still fire correctly.

### Phase 2 — "premium polish" (~1 week)
- Settings menu (gear icon) — slide-up panel.
- Playback speed.
- PiP.
- Persist volume / mute / speed / language-pref / auto-next to localStorage.
- Next-episode card with countdown + auto-advance toggle.
- Resume snackbar moved inside overlay.
- **Audio / Language menu** in settings — repurpose OPhim server selector. Remove the standalone [server-section.tsx](../components/watch/server-section.tsx) from below the video.
- Mobile gestures: swipe seek, swipe volume, swipe brightness, pinch fullscreen, lock screen.

### Phase 3 — "production-grade" (~1–2 weeks)
- Hover scrub thumbnails — requires backend ffmpeg sprite pipeline (see §12).
- Ambient mode (desktop).
- Stats for nerds overlay.
- Reduced-motion + full a11y audit (axe, screen-reader pass).
- PostHog events for player interactions.

### Phase 4 — deferred
- Chromecast / AirPlay.

---

## 11. File map for new code

```
components/watch/
├── video-player.tsx                 (modified: remove `controls`, switch to aspect-video, mount overlay)
├── controls/
│   ├── index.tsx                    (VideoControlsOverlay shell + auto-hide logic)
│   ├── player-context.tsx           (local PlayerContext provider)
│   ├── top-bar.tsx                  (title, episode, settings gear)
│   ├── center-controls.tsx          (big play, ±10s)
│   ├── bottom-bar.tsx
│   ├── progress-bar.tsx             (scrubber + buffered + hover preview)
│   ├── volume-control.tsx
│   ├── time-display.tsx
│   ├── settings-menu.tsx            (Phase 2 — slide-up panel)
│   ├── speed-menu.tsx               (Phase 2)
│   ├── audio-language-menu.tsx      (Phase 2 — OPhim server switch)
│   ├── next-episode-card.tsx        (Phase 2)
│   ├── lock-screen.tsx              (Phase 2, mobile)
│   ├── buffering-spinner.tsx
│   ├── keyboard-hint.tsx
│   └── icons.tsx                    (centralize SVG paths)
hooks/
├── usePlayerState.ts                (new — Phase 1)
├── useKeyboardShortcuts.ts          (new — Phase 1)
├── useAutoHideControls.ts           (new — Phase 1)
├── usePlayerPersistence.ts          (new — Phase 2; volume / speed / auto-next / lang-pref)
├── useMobileGestures.ts             (new — Phase 2; swipe seek/volume/brightness, pinch)
└── useAmbientMode.ts                (new — Phase 3, desktop only)
```

Files to modify in [components/watch/index.tsx](../components/watch/index.tsx):
- Phase 1: no change beyond removing standalone server section eventually
- Phase 2: pass server props down to the new in-player Audio/Language menu via `VideoPlayer`; remove `<ServerSection>` and `<div>{t('serverHint')}</div>` block from the watch page layout.

[hooks/useVideoProgress.ts](../hooks/useVideoProgress.ts) and [hooks/useWatchAnalytics.ts](../hooks/useWatchAnalytics.ts) — **no changes needed**. They keep reading from `videoRef`.

---

## 12. Open questions

1. **Sprite-sheet thumbnails (Phase 3) — backend work.** Where would the ffmpeg job run? Options:
   - **A.** A new script in [scripts/](../scripts/) triggered on demand or cron — same place as existing trending crons. Output to Firebase Storage or a CDN bucket.
   - **B.** Generate client-side on first play (slow, redundant, eats user bandwidth) — **not recommended**.
   - **C.** Defer Phase 3 entirely if the backend cost is not justified.
2. **Mobile gesture conflicts.** Double-tap-seek vs. native browser double-tap-zoom. Use `touch-action: manipulation` on the video surface. Test on real iPhone Safari and Chrome Android.
3. **i18n.** All button `aria-label`s, tooltips, settings-menu labels need `next-intl` keys under a new `player.*` namespace in [messages/](../messages/).
4. **PostHog event taxonomy.** Add to [lib/posthog/events.ts](../lib/posthog/events.ts): `player.speed_changed`, `player.language_switched_inplayer`, `player.fullscreen_toggled`, `player.pip_toggled`, `player.next_ep_autoplayed`, `player.lockscreen_engaged`. Server switches already tracked via `analytics.serverSwitched` — decide whether to dedupe or differentiate "switched via in-player menu" vs "switched via legacy panel" during the migration window.
5. **Brightness gesture on mobile.** Real device brightness isn't web-accessible. Implement as a CSS `filter: brightness()` overlay on the `<video>` only. Make this clear in the gesture HUD label ("Screen brightness" not "Device brightness").
6. **Migration of `ServerSection`.** Remove the below-video panel entirely in Phase 2, or keep it as a fallback for users who haven't discovered the in-player menu? Recommendation: remove cleanly, since the new menu is more discoverable (gear icon).

---

## 13. Risks

| Risk | Mitigation |
|---|---|
| Regressing the resume/progress flow | Phase 1 must include a manual regression script: watched movie → resume prompt → accept → verify position. Plus PostHog dashboard to watch milestone-event rate before/after deploy. |
| iOS Safari fullscreen quirks | Use the `webkitEnterFullscreen` path explicitly; test on a real iPhone, don't trust simulators alone. |
| Mobile gesture conflicts with browser gestures | `touch-action: manipulation` on video; test pull-to-refresh, browser swipe-back, pinch-zoom collisions. |
| Auto-hide controls hides accessibility focus | Never auto-hide while any control inside the overlay has focus (`overlay.contains(document.activeElement)`). |
| Server switch in-player loses scroll context | When user switches Vietsub → Thuyết Minh via the menu, current playback time should be preserved (re-seek after stream load) so the language change feels seamless. |
| `aspect-video` layout breaks existing comments/layout below | Smoke test the watch page on mobile portrait, mobile landscape, tablet, desktop, ultra-wide. |

---

## 14. References

- [hls.js API](https://github.com/video-dev/hls.js/blob/master/docs/API.md)
- [HTML5 Video element events](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement#events)
- [Fullscreen API + iOS quirks](https://developer.apple.com/documentation/webkitjs/htmlvideoelement/1633500-webkitenterfullscreen)
- [WebVTT thumbnail track spec](https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API)
- [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Media Chrome](https://www.media-chrome.org/) — possible Phase 3+ foundation if data source evolves
- OPhim API: `https://ophim1.com/phim/{slug}` (no public docs; reverse-engineered from sample responses — see §15)

---

## 15. OPhim data model — what is and isn't possible

Verified 2026-05-22 by probing `https://ophim1.com/phim/{slug}` for 4 sample movies (`gia-nghiep`, `phien-quan-toc-xam`, `fight-against-evil-3`, `lure`).

### What OPhim returns

```json
{
  "movie": {
    "name": "Gia Nghiệp",
    "origin_name": "The Heir",
    "quality": "HD",                // display-only string (HD/FHD)
    "lang": "Vietsub + Thuyết Minh", // display-only string
    "episode_current": "...",
    "episode_total": "...",
    "category": [...],
    "country": [...]
    // ... other metadata
  },
  "episodes": [
    {
      "server_name": "Vietsub #1",
      "server_data": [
        {
          "name": "1", "slug": "1",
          "filename": "...",
          "link_embed": "https://vip.opstream90.com/share/...",
          "link_m3u8": "https://vip.opstream90.com/.../index.m3u8"
        },
        // ... more episodes
      ]
    },
    {
      "server_name": "Thuyết Minh #1",
      "server_data": [ /* same shape, different stream URL */ ]
    }
  ]
}
```

### Probing the m3u8

Every sampled `link_m3u8` was a master playlist with **exactly one variant**:

```
#EXTM3U
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=800000,RESOLUTION=1920x1080
3000k/hls/mixed.m3u8
```

### Implications for the player

| Native HLS/HTML5 feature | OPhim support | Player implication |
|---|---|---|
| Adaptive bitrate (`hls.levels`) | ❌ length = 1 across all sampled titles | No quality selector |
| Subtitle tracks (`hls.subtitleTracks` or `<track>`) | ❌ subtitles are hard-burned into video | No subtitle menu, no custom cue styling |
| Audio tracks (`hls.audioTracks`) | ❌ each language is a separate server, not an HLS audio group | No in-stream audio switch; instead → in-player **Audio/Language menu** that calls `onServerChange()` |
| Chapter markers | ❌ no marker data | No chapter UI |
| Intro/outro markers | ❌ no marker data | No Skip Intro/Outro |
| Trailer | ✅ `trailer_url` exists | Could ship a trailer-modal feature later; not in current scope |

### What the UI exposes for the user

- **Display-only metadata**: `quality`, `lang`, `episode_current`, `episode_total` — surface in top-bar / settings panel as info, not interactive controls.
- **Interactive control**: server switch (Vietsub / Thuyết Minh / etc.) framed as **Audio / Language** in the settings menu.
- **Episode switch**: stays where it is (below video) for serial content; player only shows the current episode title.

### If the data source changes

If a future API surfaces real `.vtt` subtitle URLs, multi-quality manifests, or chapter markers, the player architecture supports adding them as new settings-menu entries without rewriting the controls layer — just plumb the data through `PlayerContext`. Until then, the menu structure stays minimal: **Speed · Audio/Language · Auto-play next**.
