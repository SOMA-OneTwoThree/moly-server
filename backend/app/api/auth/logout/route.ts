import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Public path: clear the web cookie session. Native clients sign out via their
 * own SDK. The cleared cookies are written onto the returned response.
 */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
