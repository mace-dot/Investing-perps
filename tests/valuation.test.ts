import { describe, expect, it } from "vitest";
import {
  cashFromOperations,
  earningsPerShare,
  firstValuationComparison,
  freeCashFlow,
  ownershipAfterIssuance,
} from "@/lib/valuation";

describe("first valuation example", () => {
  it("prices the whole businesses and finds the lower P/E", () => {
    const result = firstValuationComparison();
    expect(result.a.wholeBusinessPrice).toBe(8_000_000_000);
    expect(result.b.wholeBusinessPrice).toBe(800_000_000);
    expect(result.a.pe).toBe(200);
    expect(result.b.pe).toBe(20);
    expect(result.lower).toBe("B");
  });
});

describe("other deterministic finance", () => {
  it("cuts ownership in half when the share count doubles", () => {
    expect(ownershipAfterIssuance(1_000_000, 1_000_000, 1_000_000).ownership).toBe(0.5);
  });

  it("halves earnings per share when profit is flat and shares double", () => {
    expect(earningsPerShare(10_000_000, 20_000_000)).toBe(0.5);
  });

  it("treats unpaid bills as profit that is not cash", () => {
    expect(cashFromOperations({ netIncome: 5_000_000, increaseInReceivables: 6_000_000, depreciation: 0 })).toBe(-1_000_000);
  });

  it("subtracts equipment spending from operating cash", () => {
    expect(freeCashFlow(6_000_000, 7_000_000)).toBe(-1_000_000);
  });
});
