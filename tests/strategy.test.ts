import { describe, expect, it } from "vitest";
import { buildStrategy, parseMoney } from "@/lib/strategy";

describe("money picture", () => {
  it("reads a dollar amount and rejects a blank or a word", () => {
    expect(parseMoney("$2,400")).toBe(2400);
    expect(parseMoney("")).toBeNull();
    expect(parseMoney("lots")).toBeNull();
  });

  it("starts with cash when bills are ahead of income", () => {
    const plan = buildStrategy({
      employment: "student",
      incomeMonthly: 1200,
      billsMonthly: 1800,
      cashSaved: 400,
      creditBand: "building",
    }, "growth");
    expect(plan.topicIds[0]).toBe("cash");
    expect(plan.headline).toContain("bills");
    expect(`${plan.headline} ${plan.steps.map((step) => step.body).join(" ")} ${plan.boundary}`).not.toMatch(/\b(buy|sell|hold)\b/i);
  });

  it("can study what a price expects when bills are covered and the goal is growth", () => {
    const plan = buildStrategy({
      employment: "full_time",
      incomeMonthly: 4200,
      billsMonthly: 2200,
      cashSaved: 12000,
      creditBand: "strong",
    }, "growth");
    expect(plan.topicIds[0]).toBe("expectations");
    expect(plan.boundary).toContain("does not");
  });
});
