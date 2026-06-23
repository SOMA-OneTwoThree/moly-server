import { NextResponse } from "next/server";

// Public health check (allowlisted in middleware).
export async function GET() {
  return NextResponse.json({ status: "ok", ts: new Date().toISOString() });
}
