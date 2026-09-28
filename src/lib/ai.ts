import { z } from "zod";

export const MISCONCEPTION_TAGS = [
  "share_price_is_the_business_price",
  "lower_multiple_means_better_investment",
  "more_holdings_means_diversified",
  "calm_correlation_means_a_hedge",
  "profit_is_cash",
  "revenue_is_profit",
  "good_business_means_good_price",
  "price_move_measures_quality",
  "same_share_count_means_same_ownership",
  "thesis_without_disconfirmation",
  "fame_or_popularity_is_evidence",
  "selection_and_reason_disagree",
] as const;

export const reasoningSchema = z.object({
  reasoningAssessment: z.enum(["sound", "partial", "misconception", "unclear"]),
  misconceptionTag: z.enum(MISCONCEPTION_TAGS).nullable(),
  understood: z.string().min(1).max(400),
  explanation: z.string().min(1).max(700),
  clarifyingQuestion: z.string().max(240).nullable(),
});

export type ReasoningResult = z.infer<typeof reasoningSchema>;

export const composerSuggestionSchema = z.object({
  targetField: z.string().min(1).max(80),
  suggestion: z.string().min(1).max(700),
  why: z.string().min(1).max(300),
});

export const composeDocumentSchema = z.object({
  title: z.string().min(3).max(140),
  hook: z.string().min(8).max(220),
  essay: z.string().min(40).max(4000),
  fields: z.record(z.string().max(2000)),
});

export type ComposerSuggestion = z.infer<typeof composerSuggestionSchema>;

export function parseReasoning(payload: unknown, allowedTags: readonly string[]): ReasoningResult | null {
  const parsed = reasoningSchema.safeParse(payload);
  if (!parsed.success) return null;
  if (parsed.data.misconceptionTag && !allowedTags.includes(parsed.data.misconceptionTag)) return null;
  return parsed.data;
}

export function fallbackReasoning(canonical: {
  understood: string;
  explanation: string;
  clarifyingQuestion: string | null;
  reasoningAssessment: ReasoningResult["reasoningAssessment"];
  misconceptionTag: ReasoningResult["misconceptionTag"];
}): ReasoningResult & { source: "canonical" } {
  return { ...canonical, source: "canonical" };
}

export async function withTimeout<T>(work: (signal: AbortSignal) => Promise<T>, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await work(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

export type AiCallResult<T> =
  | { ok: true; value: T; source: "model" }
  | { ok: false; reason: "unconfigured" | "timeout" | "invalid" | "upstream" };

/**
 * OpenAI-compatible adapter. The base URL defaults to the Vercel AI Gateway.
 * User text is sent only as data inside a fixed instruction, never as the instruction itself.
 */
export async function completeJson(input: {
  system: string;
  user: string;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}): Promise<AiCallResult<unknown>> {
  const env = input.env ?? process.env;
  const apiKey = env.AI_API_KEY;
  if (!apiKey) return { ok: false, reason: "unconfigured" };

  const base = (env.AI_BASE_URL || "https://ai-gateway.vercel.sh/v1").replace(/\/$/, "");
  const model = env.AI_MODEL || "openai/gpt-4.1-mini";
  const timeoutMs = input.timeoutMs ?? Number(env.AI_TIMEOUT_MS || 8000);

  try {
    const response = await withTimeout((signal) => {
      return fetch(`${base}/chat/completions`, {
        method: "POST",
        signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: input.system },
            { role: "user", content: input.user },
          ],
        }),
      });
    }, timeoutMs);

    if (!response.ok) return { ok: false, reason: "upstream" };
    const body = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content) return { ok: false, reason: "invalid" };
    try {
      return { ok: true, value: JSON.parse(content), source: "model" };
    } catch {
      return { ok: false, reason: "invalid" };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, reason: "timeout" };
    }
    return { ok: false, reason: "upstream" };
  }
}
