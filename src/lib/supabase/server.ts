import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { getSupabaseEnv, getSupabaseServiceEnv } from "./env";

/**
 * Cookie-aware Supabase client for Server Components, Route Handlers and Server Actions.
 * Reads/writes the auth session through the Next.js cookie store.
 */
export async function getSupabaseServerClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options as CookieOptions);
          }
        } catch {
          // Server Components cannot write cookies; ignore — middleware/proxy handles refresh.
        }
      },
    },
  });
}

/**
 * Service-role client. Bypasses RLS — use only inside trusted server code:
 *  - background processing (face embeddings, thumbnails)
 *  - selfie search (anonymous queries)
 *  - order creation by anonymous customers
 *
 * Never import from a Client Component.
 */
import { createClient } from "@supabase/supabase-js";

export function getSupabaseServiceClient() {
  const { url } = getSupabaseEnv();
  const { serviceRoleKey } = getSupabaseServiceEnv();
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-application": "lensia-server" } },
  });
}
