"use client";

import { createBrowserClient } from "@supabase/ssr";
import { databaseTargetRefusal, isInvestingPerpsConfigured } from "@/lib/env";

export function createSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const refusal = databaseTargetRefusal({
    projectName: process.env.NEXT_PUBLIC_SUPABASE_PROJECT_NAME,
    supabaseUrl: url,
  });
  if (refusal || !url || !key || !isInvestingPerpsConfigured()) return null;
  return createBrowserClient(url, key);
}
