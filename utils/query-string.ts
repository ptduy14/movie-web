/**
 * Rebuild `?a=1&b=2` from a page's `searchParams` prop, or `''` when empty.
 * Used when a server component redirects and the filters must survive.
 */
export function queryString(searchParams: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    else if (value !== undefined) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
