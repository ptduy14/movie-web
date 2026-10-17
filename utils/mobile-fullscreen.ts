/**
 * Mobile fullscreen helpers for the player.
 *
 * `isTouchDevice` mirrors the Tailwind `touch:` variant (`(hover: none)`).
 * `requestVideoFullscreen` enters fullscreen on the player container, falling
 * back to iOS Safari's video-only `webkitEnterFullscreen`. Orientation locking
 * to landscape is handled centrally in `usePlayerState` on `fullscreenchange`
 * (so both auto-play-fullscreen and the manual button get it); iOS ignores the
 * lock API but rotates natively in fullscreen.
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(hover: none)').matches;
}

export function requestVideoFullscreen(
  container: HTMLElement | null,
  video: HTMLVideoElement | null
): void {
  if (typeof document !== 'undefined' && document.fullscreenElement) return;

  const target = container as any;
  const req = target?.requestFullscreen || target?.webkitRequestFullscreen;
  if (target && req) {
    try {
      const result = req.call(target);
      if (result && typeof result.catch === 'function') result.catch(() => {});
    } catch {
      /* not allowed / user denied */
    }
    return;
  }

  const iosVideo = video as any;
  if (typeof iosVideo?.webkitEnterFullscreen === 'function') {
    iosVideo.webkitEnterFullscreen();
  }
}
