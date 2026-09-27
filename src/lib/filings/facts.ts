export type FactPoint = {
  start?: string;
  end?: string;
  val?: number;
  fp?: string;
  form?: string;
  filed?: string;
};

export type CompanyFacts = {
  entityName?: string;
  facts?: {
    "us-gaap"?: Record<string, { units?: { USD?: FactPoint[] } }>;
  };
};

export type AnnualPoint = {
  end: string;
  value: number;
  filed: string | null;
  form: string | null;
};

export type StatementSet = {
  revenue: AnnualPoint[];
  profit: AnnualPoint[];
  operatingCash: AnnualPoint[];
  capex: AnnualPoint[];
  cash: AnnualPoint[];
  assets: AnnualPoint[];
  liabilities: AnnualPoint[];
  currentAssets: AnnualPoint[];
  currentLiabilities: AnnualPoint[];
  longTermDebt: AnnualPoint[];
  dividends: AnnualPoint[];
};

const REVENUE = [
  "RevenueFromContractWithCustomerExcludingAssessedTax",
  "SalesRevenueNet",
  "Revenues",
  "RevenueFromContractWithCustomerIncludingAssessedTax",
];
const PROFIT = ["NetIncomeLoss"];
const OPERATING_CASH = ["NetCashProvidedByUsedInOperatingActivities"];
const CAPEX = ["PaymentsToAcquirePropertyPlantAndEquipment"];
const CASH = ["CashAndCashEquivalentsAtCarryingValue"];
const ASSETS = ["Assets"];
const LIABILITIES = ["Liabilities"];
const CURRENT_ASSETS = ["AssetsCurrent"];
const CURRENT_LIABILITIES = ["LiabilitiesCurrent"];
const DEBT = ["LongTermDebtNoncurrent", "LongTermDebt"];
const DIVIDENDS = ["PaymentsOfDividends", "PaymentsOfDividendsCommonStock", "PaymentsOfOrdinaryDividends"];

function daysBetween(start: string, end: string): number {
  return (Date.parse(end) - Date.parse(start)) / 86_400_000;
}

export function selectAnnual(points: FactPoint[], kind: "duration" | "instant"): AnnualPoint[] {
  const annual = points.filter((point) => {
    if (point.form !== "10-K" && point.form !== "10-K/A") return false;
    if (point.fp && point.fp !== "FY") return false;
    if (typeof point.val !== "number" || !point.end) return false;
    if (kind === "duration") {
      if (!point.start) return false;
      const days = daysBetween(point.start, point.end);
      return days >= 300 && days <= 380;
    }
    if (!point.start || point.start === point.end) return true;
    return daysBetween(point.start, point.end) <= 2;
  });

  const byEnd = new Map<string, FactPoint>();
  for (const point of annual) {
    const end = point.end as string;
    const existing = byEnd.get(end);
    if (!existing || (point.filed ?? "") >= (existing.filed ?? "")) byEnd.set(end, point);
  }

  return [...byEnd.values()]
    .map((point) => ({
      end: point.end as string,
      value: point.val as number,
      filed: point.filed ?? null,
      form: point.form ?? null,
    }))
    .sort((a, b) => a.end.localeCompare(b.end));
}

function series(facts: CompanyFacts, names: string[], kind: "duration" | "instant"): AnnualPoint[] {
  const gaap = facts.facts?.["us-gaap"] ?? {};
  for (const name of names) {
    const points = selectAnnual(gaap[name]?.units?.USD ?? [], kind);
    if (points.length > 0) return points;
  }
  return [];
}

export function statementSetFromFacts(facts: CompanyFacts): StatementSet {
  return {
    revenue: series(facts, REVENUE, "duration"),
    profit: series(facts, PROFIT, "duration"),
    operatingCash: series(facts, OPERATING_CASH, "duration"),
    capex: series(facts, CAPEX, "duration"),
    cash: series(facts, CASH, "instant"),
    assets: series(facts, ASSETS, "instant"),
    liabilities: series(facts, LIABILITIES, "instant"),
    currentAssets: series(facts, CURRENT_ASSETS, "instant"),
    currentLiabilities: series(facts, CURRENT_LIABILITIES, "instant"),
    longTermDebt: series(facts, DEBT, "instant"),
    dividends: series(facts, DIVIDENDS, "duration"),
  };
}

export function latest(points: AnnualPoint[]): AnnualPoint | null {
  return points.length > 0 ? points[points.length - 1] : null;
}

export function prior(points: AnnualPoint[]): AnnualPoint | null {
  return points.length > 1 ? points[points.length - 2] : null;
}

export function changeRatio(points: AnnualPoint[]): number | null {
  const current = latest(points);
  const previous = prior(points);
  if (!current || !previous || previous.value === 0) return null;
  return (current.value - previous.value) / Math.abs(previous.value);
}

export function emptyStatements(): StatementSet {
  return {
    revenue: [],
    profit: [],
    operatingCash: [],
    capex: [],
    cash: [],
    assets: [],
    liabilities: [],
    currentAssets: [],
    currentLiabilities: [],
    longTermDebt: [],
    dividends: [],
  };
}
