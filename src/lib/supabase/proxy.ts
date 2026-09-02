import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "./database.types";
import { supabaseAnonKey, supabaseUrl } from "./env";

const PUBLIC_PATHS = ["/login", "/signup", "/auth"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * Refreshes the Supabase auth session on every request and redirects
 * unauthenticated visitors away from protected routes. Called from
 * `src/proxy.ts` (Next.js 16 renamed the `middleware.ts` convention to
 * `proxy.ts`).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}
