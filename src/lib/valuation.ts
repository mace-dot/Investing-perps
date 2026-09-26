export function marketCap(pricePerShare: number, shares: number): number {
  if (!Number.isFinite(pricePerShare) || !Number.isFinite(shares)) {
    throw new Error("Price and shares must be finite numbers.");
  }
  if (pricePerShare < 0 || shares < 0) {
    throw new Error("Price and shares cannot be negative.");
  }
  return pricePerShare * shares;
}

export function peRatio(wholeBusinessPrice: number, annualNetIncome: number): number {
  if (!Number.isFinite(wholeBusinessPrice) || !Number.isFinite(annualNetIncome)) {
    throw new Error("Market cap and net income must be finite numbers.");
  }
  if (annualNetIncome === 0) {
    throw new Error("P/E is undefined when annual net income is zero.");
  }
  return wholeBusinessPrice / annualNetIncome;
}

export type ShareFacts = {
  pricePerShare: number;
  shares: number;
  annualNetIncome: number;
};

export function valuationSnapshot(facts: ShareFacts) {
  const wholeBusinessPrice = marketCap(facts.pricePerShare, facts.shares);
  return {
    wholeBusinessPrice,
    pe: peRatio(wholeBusinessPrice, facts.annualNetIncome),
  };
}

/** The curriculum's first comparison. Company B has the lower P/E. */
export const FIRST_VALUATION_EXAMPLE = {
  companyA: { pricePerShare: 8, shares: 1_000_000_000, annualNetIncome: 40_000_000 },
  companyB: { pricePerShare: 80, shares: 10_000_000, annualNetIncome: 40_000_000 },
} as const;

export function firstValuationComparison() {
  const a = valuationSnapshot(FIRST_VALUATION_EXAMPLE.companyA);
  const b = valuationSnapshot(FIRST_VALUATION_EXAMPLE.companyB);
  const lower = a.pe < b.pe ? "A" : b.pe < a.pe ? "B" : "tie";
  return { a, b, lower };
}

export function ownershipAfterIssuance(existingShares: number, newShares: number, holderShares: number) {
  if (existingShares < 0 || newShares < 0 || holderShares < 0) {
    throw new Error("Share counts cannot be negative.");
  }
  const total = existingShares + newShares;
  if (total === 0) throw new Error("Total shares cannot be zero.");
  return {
    totalShares: total,
    ownership: holderShares / total,
  };
}

export function earningsPerShare(annualNetIncome: number, shares: number) {
  if (shares === 0) throw new Error("EPS is undefined when the share count is zero.");
  return annualNetIncome / shares;
}

export function cashFromOperations(input: {
  netIncome: number;
  increaseInReceivables: number;
  depreciation: number;
}) {
  return input.netIncome - input.increaseInReceivables + input.depreciation;
}

export function freeCashFlow(cashFromOperationsAmount: number, capitalExpenditures: number) {
  return cashFromOperationsAmount - capitalExpenditures;
}
