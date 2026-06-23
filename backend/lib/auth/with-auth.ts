import { NextResponse, type NextRequest } from "next/server";
import { requireUser, type AuthContext } from "./require-user";

type AuthedHandler = (
  req: NextRequest,
  ctx: AuthContext,
) => Promise<NextResponse> | NextResponse;

/**
 * Wrap a protected Route Handler. This is the security AUTHORITY for the route:
 * it runs the authoritative `getUser` validation (via `requireUser`) and returns
 * 401 when there is no valid user, otherwise hands the handler a verified
 * `{ user, supabase }`.
 *
 * The middleware gate is only an early, network-free rejection optimization —
 * forgetting to wrap a route here would leave it unprotected, so every
 * non-public route MUST use `withAuth`. CORS is applied centrally in the
 * middleware, not here.
 */
export function withAuth(handler: AuthedHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const ctx = await requireUser(req);
    if (!ctx) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return handler(req, ctx);
  };
}
