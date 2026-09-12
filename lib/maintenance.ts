/**
 * Site-wide maintenance switch.
 *
 * `MAINTENANCE_MODE=true` gates every user-facing route in `middleware.ts`
 * (rewritten to `/maintenance/{locale}`) and short-circuits the translation
 * cron. Deliberately NOT a `NEXT_PUBLIC_` var: nothing in the browser needs
 * it, and public vars get inlined into the client bundle.
 *
 * Flipping it is an env-var change + redeploy — no code edit.
 */
export function isMaintenanceMode(): boolean {
  return process.env.MAINTENANCE_MODE === 'true';
}
