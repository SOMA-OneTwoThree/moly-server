/**
 * Sanitize a post-login `next` redirect target to prevent open redirects.
 * Only same-origin absolute paths are allowed (must start with a single "/").
 */
export function safeNextPath(next: string | null, fallback = "/api/me"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}
