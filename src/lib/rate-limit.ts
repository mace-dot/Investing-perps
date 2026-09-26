export type RateBucket = {
  windowStartMs: number;
  count: number;
};

const memory = new Map<string, RateBucket>();

export function takeRateToken(input: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
  store?: Map<string, RateBucket>;
}): { allowed: boolean; remaining: number } {
  const store = input.store ?? memory;
  const now = input.now ?? Date.now();
  const current = store.get(input.key);
  if (!current || now - current.windowStartMs >= input.windowMs) {
    store.set(input.key, { windowStartMs: now, count: 1 });
    return { allowed: true, remaining: input.limit - 1 };
  }
  if (current.count >= input.limit) {
    return { allowed: false, remaining: 0 };
  }
  current.count += 1;
  return { allowed: true, remaining: input.limit - current.count };
}

export function aiDailyLimit(env: NodeJS.ProcessEnv = process.env): number {
  const parsed = Number(env.AI_DAILY_LIMIT_PER_USER || 30);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
}
