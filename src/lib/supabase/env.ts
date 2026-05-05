type SupabaseEnv = {
  url: string;
  publishableKey: string;
};

type SupabaseServiceEnv = {
  serviceRoleKey: string;
};

let cached: SupabaseEnv | null = null;

export function getSupabaseEnv(): SupabaseEnv {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local."
    );
  }
  cached = { url, publishableKey };
  return cached;
}

export function getSupabaseServiceEnv(): SupabaseServiceEnv {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for server-side privileged operations."
    );
  }
  return { serviceRoleKey };
}
