import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";
import { supabaseAnonKey, supabaseUrl } from "./env";

/** Supabase client for use in Client Components. */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
