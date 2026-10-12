import "server-only";

/**
 * Defence-in-depth origin check for state-changing requests.
 * Cookies are already SameSite=Lax (blocking cross-site POSTs), this rejects
 * any request whose Origin header doesn't match the site.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser client or same-origin GET-style post

  try {
    const requestHost = new URL(request.url).host;
    return new URL(origin).host === requestHost;
  } catch {
    return false;
  }
}
