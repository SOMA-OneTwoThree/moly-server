import { NextResponse } from "next/server";

/** Public: human/diagnostic endpoint the OAuth callback redirects to on failure. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reason = searchParams.get("reason") ?? "oauth_error";
  return NextResponse.json({ error: "oauth_failed", reason }, { status: 400 });
}
