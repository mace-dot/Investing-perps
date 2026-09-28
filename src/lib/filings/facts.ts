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
  grossProfit: AnnualPoint[];
  operatingIncome: AnnualPoint[];
  investingCash: AnnualPoint[];
  financingCash: AnnualPoint[];
  equity: AnnualPoint[];
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
const GROSS = ["GrossProfit"];
const OPERATING_INCOME = ["OperatingIncomeLoss"];
const INVESTING_CASH = ["NetCashProvidedByUsedInInvestingActivities"];
const FINANCING_CASH = ["NetCashProvidedByUsedInFinancingActivities"];
const EQUITY = ["StockholdersEquity", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"];

export type ReportPeriod = "annual" | "quarter";

function daysBetween(start: string, end: string): number {
  return (Date.parse(end) - Date.parse(start)) / 86_400_000;
}

function toSeries(points: FactPoint[]): AnnualPoint[] {
  const byEnd = new Map<string, FactPoint>();
  for (const point of points) {
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

function matchesSpan(point: FactPoint, kind: "duration" | "instant", minDays: number, maxDays: number): boolean {
  if (typeof point.val !== "number" || !point.end) return false;
  if (kind === "duration") {
    if (!point.start) return false;
    const days = daysBetween(point.start, point.end);
    return days >= minDays && days <= maxDays;
  }
  if (!point.start || point.start === point.end) return true;
  return daysBetween(point.start, point.end) <= 2;
}

export function selectAnnual(points: FactPoint[], kind: "duration" | "instant"): AnnualPoint[] {
  return toSeries(points.filter((point) => {
    if (point.form !== "10-K" && point.form !== "10-K/A") return false;
    if (point.fp && point.fp !== "FY") return false;
    return matchesSpan(point, kind, 300, 380);
  }));
}

export function selectQuarter(points: FactPoint[], kind: "duration" | "instant"): AnnualPoint[] {
  const quarters = new Set(["Q1", "Q2", "Q3"]);
  const filed = points.filter((point) => {
    if (point.form !== "10-Q" && point.form !== "10-Q/A") return false;
    if (point.fp && !quarters.has(point.fp)) return false;
    return typeof point.val === "number" && Boolean(point.end);
  });
  if (kind === "instant") {
    return toSeries(filed.filter((point) => matchesSpan(point, "instant", 75, 110)));
  }
  return singleQuarters(filed);
}

function singleQuarters(points: FactPoint[]): AnnualPoint[] {
  const bySpan = new Map<string, FactPoint>();
  for (const point of points) {
    if (!point.start) continue;
    const key = `${point.end}|${point.start}`;
    const existing = bySpan.get(key);
    if (!existing || (point.filed ?? "") >= (existing.filed ?? "")) bySpan.set(key, point);
  }
  const rows = [...bySpan.values()];
  const byEnd = new Map<string, FactPoint[]>();
  for (const point of rows) {
    const end = point.end as string;
    const list = byEnd.get(end) ?? [];
    list.push(point);
    byEnd.set(end, list);
  }
  const series: AnnualPoint[] = [];
  for (const end of [...byEnd.keys()].sort()) {
    const options = byEnd.get(end) ?? [];
    const quarter = options.find((point) => {
      const days = daysBetween(point.start as string, point.end as string);
      return days >= 75 && days <= 110;
    });
    if (quarter) {
      series.push(asPoint(quarter));
      continue;
    }
    const ytd = options.slice().sort((a, b) => daysBetween(b.start as string, b.end as string) - daysBetween(a.start as string, a.end as string))[0];
    if (!ytd?.start) continue;
    const earlier = rows
      .filter((point) => point.start === ytd.start && (point.end as string) < end)
      .sort((a, b) => (b.end as string).localeCompare(a.end as string));
    const base = earlier[0];
    if (!base?.start) continue;
    const gap = daysBetween(base.end as string, end);
    if (gap < 75 || gap > 110) continue;
    series.push({
      end,
      value: (ytd.val as number) - (base.val as number),
      filed: ytd.filed ?? null,
      form: ytd.form ?? null,
    });
  }
  return series;
}

function asPoint(point: FactPoint): AnnualPoint {
  return {
    end: point.end as string,
    value: point.val as number,
    filed: point.filed ?? null,
    form: point.form ?? null,
  };
}

export function selectReported(points: FactPoint[], kind: "duration" | "instant", period: ReportPeriod = "annual"): AnnualPoint[] {
  return period === "quarter" ? selectQuarter(points, kind) : selectAnnual(points, kind);
}

function series(facts: CompanyFacts, names: string[], kind: "duration" | "instant", period: ReportPeriod): AnnualPoint[] {
  const gaap = facts.facts?.["us-gaap"] ?? {};
  for (const name of names) {
    const points = selectReported(gaap[name]?.units?.USD ?? [], kind, period);
    if (points.length > 0) return points;
  }
  return [];
}

export function statementSetFromFacts(facts: CompanyFacts, period: ReportPeriod = "annual"): StatementSet {
  return {
    revenue: series(facts, REVENUE, "duration", period),
    profit: series(facts, PROFIT, "duration", period),
    operatingCash: series(facts, OPERATING_CASH, "duration", period),
    capex: series(facts, CAPEX, "duration", period),
    cash: series(facts, CASH, "instant", period),
    assets: series(facts, ASSETS, "instant", period),
    liabilities: series(facts, LIABILITIES, "instant", period),
    currentAssets: series(facts, CURRENT_ASSETS, "instant", period),
    currentLiabilities: series(facts, CURRENT_LIABILITIES, "instant", period),
    longTermDebt: series(facts, DEBT, "instant", period),
    dividends: series(facts, DIVIDENDS, "duration", period),
    grossProfit: series(facts, GROSS, "duration", period),
    operatingIncome: series(facts, OPERATING_INCOME, "duration", period),
    investingCash: series(facts, INVESTING_CASH, "duration", period),
    financingCash: series(facts, FINANCING_CASH, "duration", period),
    equity: series(facts, EQUITY, "instant", period),
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
    grossProfit: [],
    operatingIncome: [],
    investingCash: [],
    financingCash: [],
    equity: [],
  };
}
