/**
 * Single source of truth for publicly accessible API paths.
 *
 * Only the health check is public. Everything else under /api is token-locked
 * (Bearer). Shared by the middleware gate so the allowlist never drifts.
 */
export const PUBLIC_PREFIXES = ["/api/health"] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}
