export type InvestingGoal = "stability" | "growth" | "income";

export type FilingSource = "edgar" | "upload" | "edgar-and-upload";

export type FilingFigure = {
  label: string;
  value: string;
  periodEnd: string;
};

export type FilingSection = {
  id: string;
  title: string;
  figures: FilingFigure[];
  indicates: string;
  mislead: string;
};

export type FilingExcerpt = {
  heading: string;
  text: string;
};

export type StatementLine = {
  label: string;
  formal: string;
  value: string;
  prior: string | null;
  means: string;
};

export type StatementSheet = {
  id: "income" | "balance" | "cash";
  kicker: string;
  title: string;
  plain: string;
  lines: StatementLine[];
};

export type ReportSpan = "annual" | "quarter";

export type FilingReading = {
  source: FilingSource;
  companyName: string;
  ticker: string | null;
  cik: string | null;
  form: string | null;
  periodKind: ReportSpan;
  periodEnd: string | null;
  sheets: StatementSheet[];
  filed: string | null;
  filingUrl: string | null;
  goal: InvestingGoal;
  goalLabel: string;
  overview: string;
  sections: FilingSection[];
  excerpts: FilingExcerpt[];
  excerptReading: string;
  alignment: {
    headline: string;
    detail: string;
    tensions: string[];
    fits: string[];
  };
  proseSource: "canonical" | "model";
  proseNote: string;
  notAdvice: string;
};

export type CompanyMatch = {
  ticker: string;
  name: string;
  cik: string;
};

export const NOT_ADVICE =
  "This is a reading of a filing against a goal you chose. It does not tell you what to do with your money.";

export const GOAL_LABELS: Record<InvestingGoal, string> = {
  stability: "Safer and more stable",
  growth: "Room for bigger swings if the business is growing",
  income: "Cash paid out along the way",
};
