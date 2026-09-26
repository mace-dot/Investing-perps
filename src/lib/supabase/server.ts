import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { databaseTargetRefusal, isInvestingPerpsConfigured, readDatabaseTarget } from "@/lib/env";

function assertTarget() {
  const target = readDatabaseTarget();
  const refusal = databaseTargetRefusal(target);
  if (refusal) throw new Error(refusal);
  if (!isInvestingPerpsConfigured()) return null;
  return target;
}

export async function createSupabaseServer() {
  const target = assertTarget();
  if (!target?.supabaseUrl) return null;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return null;
  const cookieStore = await cookies();
  return createServerClient(target.supabaseUrl, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot always write cookies. src/proxy.ts refreshes the session.
        }
      },
    },
  });
}

export function createSupabaseAdmin() {
  const target = assertTarget();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!target?.supabaseUrl || !serviceKey) return null;
  return createClient(target.supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
