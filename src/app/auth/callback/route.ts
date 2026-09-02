import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Completes the PKCE flow for magic links, invites, and password-recovery
 * emails. Not used by the password-login path in src/app/login, but the
 * exchange is required infrastructure the moment any of those flows are
 * turned on.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/"}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
