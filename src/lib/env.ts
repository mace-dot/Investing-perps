/**
 * Live data is allowed only for the Supabase project named "investing perps".
 * Any target that looks like the Favos database is refused.
 */

export const INVESTING_PERPS_PROJECT_NAME = "investing perps";

export function normalizeProjectName(name: string): string {
  return name.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

export type DatabaseTargetInput = {
  projectName?: string | null;
  supabaseUrl?: string | null;
  databaseUrl?: string | null;
};

export function databaseTargetRefusal(input: DatabaseTargetInput): string | null {
  const blob = [input.projectName, input.supabaseUrl, input.databaseUrl]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (blob.includes("favos")) {
    return "Refusing to connect. This target matches the Favos database. Investing Reps uses only the separate Supabase project named investing perps.";
  }

  return null;
}

export function readDatabaseTarget(env: NodeJS.ProcessEnv = process.env): DatabaseTargetInput {
  return {
    projectName: env.SUPABASE_PROJECT_NAME || env.NEXT_PUBLIC_SUPABASE_PROJECT_NAME,
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    databaseUrl: env.SUPABASE_DB_URL,
  };
}

export function isInvestingPerpsConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  const target = readDatabaseTarget(env);
  if (databaseTargetRefusal(target)) return false;
  if (normalizeProjectName(target.projectName ?? "") !== INVESTING_PERPS_PROJECT_NAME) return false;
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!target.supabaseUrl || !key) return false;
  return true;
}

export function liveModeOrRefusal(env: NodeJS.ProcessEnv = process.env):
  | { mode: "live" }
  | { mode: "demo"; reason: string }
  | { mode: "blocked"; reason: string } {
  const target = readDatabaseTarget(env);
  const refusal = databaseTargetRefusal(target);
  if (refusal) return { mode: "blocked", reason: refusal };
  if (isInvestingPerpsConfigured(env)) return { mode: "live" };
  return {
    mode: "demo",
    reason:
      'Live accounts are off until SUPABASE_PROJECT_NAME is exactly "investing perps" and the URL and publishable key for that new project are set. Nothing is written to Favos.',
  };
}
