function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Check .env.local against .env.example.`,
    );
  }
  return value;
}

export const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
export const supabaseAnonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
