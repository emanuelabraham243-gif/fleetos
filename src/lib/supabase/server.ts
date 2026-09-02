import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "./database.types";
import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Supabase client for use in Server Components, Server Actions, and Route
 * Handlers. Server Components can't write cookies, so the `setAll` call
 * below throws there -- that's expected and harmless as long as the
 * session is also refreshed in `proxy.ts` on every request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component -- proxy.ts refreshes the
          // session instead, so this can be safely ignored.
        }
      },
    },
  });
}
