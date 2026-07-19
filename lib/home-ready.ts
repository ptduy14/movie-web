// Module-level readiness signal used by the brand intro's warm-up sync.
//
// The intro (components/intro/brand-intro.tsx) plays for a FIXED duration and
// masks homepage bootstrap running in parallel behind it. When the home hero's
// critical data has resolved, it calls markHomeReady(); the intro waits for
// that signal for a small, hard-capped grace window before revealing — so the
// reveal ends on a painted home instead of a skeleton, without ever hanging.
//
// State lives at module scope, so it resets naturally on every full page load
// (a fresh JS bundle) — which is exactly the "every visit" semantics we want.
// It is NOT tied to the disclaimer (which is config-gated and first-visit only)
// — the whole warm-up budget is the intro's own display time.

let ready = false;
const listeners = new Set<() => void>();

/** Signal that the homepage's critical content has resolved. Idempotent. */
export function markHomeReady(): void {
  if (ready) return;
  ready = true;
  listeners.forEach((l) => l());
  listeners.clear();
}

/** Whether the homepage has already signalled readiness this page load. */
export function isHomeReady(): boolean {
  return ready;
}

/** Resolves when home is ready (immediately if it already is). */
export function whenHomeReady(): Promise<void> {
  if (ready) return Promise.resolve();
  return new Promise<void>((resolve) => {
    listeners.add(resolve);
  });
}
