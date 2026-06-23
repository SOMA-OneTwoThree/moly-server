/**
 * Single source of truth for publicly accessible API paths.
 *
 * Only health-check and auth routes are public. Everything else under /api is
 * token-locked. Shared by the middleware gate so the allowlist never drifts.
 */
export const PUBLIC_PREFIXES = ["/api/health", "/api/auth"] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}
