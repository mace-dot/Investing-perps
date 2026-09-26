import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseReasoning } from "@/lib/ai";
import { ANSWER_KEYS } from "@/lib/curriculum/answer-keys";
import { LESSONS } from "@/lib/curriculum/public-lessons";
import { databaseTargetRefusal, isInvestingPerpsConfigured, normalizeProjectName } from "@/lib/env";
import { filterFeed } from "@/lib/feed";
import { flagContent } from "@/lib/moderation";
import { safeHttpUrl } from "@/lib/urls";

describe("database target", () => {
  it("refuses anything that looks like Favos", () => {
    expect(databaseTargetRefusal({ projectName: "investing perps", supabaseUrl: "https://favos.supabase.co" })).toMatch(/Favos/);
    expect(databaseTargetRefusal({ projectName: "Favos" })).toMatch(/Favos/);
  });

  it("accepts only the investing perps project name", () => {
    expect(normalizeProjectName("Investing-Perps")).toBe("investing perps");
    expect(isInvestingPerpsConfigured({
      SUPABASE_PROJECT_NAME: "investing perps",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "pk_test",
    } as unknown as NodeJS.ProcessEnv)).toBe(true);
    expect(isInvestingPerpsConfigured({
      SUPABASE_PROJECT_NAME: "favos",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "pk_test",
    } as unknown as NodeJS.ProcessEnv)).toBe(false);
  });
});

describe("ai output", () => {
  it("rejects an invalid model payload", () => {
    expect(parseReasoning({ reasoningAssessment: "sure" }, ["share_price_is_the_business_price"])).toBeNull();
    expect(parseReasoning({
      reasoningAssessment: "sound",
      misconceptionTag: "not-a-real-tag",
      understood: "ok",
      explanation: "ok",
      clarifyingQuestion: null,
    }, ["share_price_is_the_business_price"])).toBeNull();
  });
});

describe("feed and safety helpers", () => {
  it("explains a simple reason and stops after unviewed posts", () => {
    const result = filterFeed([
      {
        id: "1",
        authorId: "a",
        authorName: "Ada",
        topicId: "valuation",
        topicName: "Valuation",
        clubId: null,
        createdAt: Date.UTC(2026, 8, 20),
        viewed: true,
      },
    ], "for_you", { interestTopicIds: ["valuation"], mistakeTopicIds: [], followedAuthorIds: [], clubId: null });
    expect(result.caughtUp).toBe(true);
    expect(result.items).toHaveLength(0);
  });

  it("allows only http and https links", () => {
    expect(safeHttpUrl("https://investor.gov")).toMatch(/^https:/);
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("https://user:pass@example.com")).toBeNull();
  });

  it("flags a guaranteed-return claim without calling the check final", () => {
    expect(flagContent("This is a guaranteed return.")[0]?.code).toBe("guaranteed_return");
  });
});

describe("migration locks", () => {
  const sql = readFileSync("supabase/migrations/20260926120000_investing_perps_init.sql", "utf8");

  it("keeps answer keys out of public policies and blocks direct score inserts", () => {
    expect(sql).toContain("create table if not exists private.answer_keys");
    expect(sql).not.toMatch(/on public\.score_events[\s\S]{0,180}for insert/);
    expect(sql).not.toMatch(/on public\.attempts[\s\S]{0,180}for insert/);
    expect(sql).toContain("for select to authenticated\n  using (user_id = (select auth.uid()))");
    expect(sql).toContain("show_on_global_ranking = true");
    expect(sql).toContain("revoke all on all tables in schema private from public, anon, authenticated");
    expect(sql).toContain("investing perps");
    expect(sql.toLowerCase()).not.toContain("favos.supabase");
  });

  it("stores the same correct choices as the server answer key", () => {
    const pairs = [...sql.matchAll(/\('([^']+)', '([a-d])'\)/g)].map((match) => [match[1], match[2]]);
    for (const [questionId, choiceId] of Object.entries(ANSWER_KEYS).map(([id, key]) => [id, key.correctChoiceId])) {
      expect(pairs).toContainEqual([questionId, choiceId]);
    }
    expect(LESSONS).toHaveLength(12);
    expect(LESSONS.every((lesson) => lesson.reviewStatus === "needs_review")).toBe(true);
  });
});
