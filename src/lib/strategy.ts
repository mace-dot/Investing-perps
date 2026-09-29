import { formatUsd } from "@/lib/filings/format";
import type { InvestingGoal } from "@/lib/filings/types";

export type EmploymentStatus = "student" | "part_time" | "full_time" | "between_jobs";
export type CreditBand = "building" | "fair" | "good" | "strong" | "skip";

export type MoneyPicture = {
  employment: EmploymentStatus | null;
  incomeMonthly: number | null;
  billsMonthly: number | null;
  cashSaved: number | null;
  creditBand: CreditBand | null;
};

export type StrategyStep = {
  title: string;
  body: string;
};

export type StrategyPlan = {
  headline: string;
  picture: string;
  steps: StrategyStep[];
  topicIds: string[];
  boundary: string;
};

export const EMPLOYMENT_LABELS: Record<EmploymentStatus, string> = {
  student: "Student",
  part_time: "Part-time work",
  full_time: "Full-time work",
  between_jobs: "Between jobs",
};

export const CREDIT_LABELS: Record<CreditBand, string> = {
  building: "Still building",
  fair: "Fair",
  good: "Good",
  strong: "Strong",
  skip: "Skip for now",
};

const BOUNDARY =
  "This path orders lessons from numbers you typed. It does not check a credit bureau, connect a bank, or name a trade.";

export function emptyMoneyPicture(): MoneyPicture {
  return {
    employment: null,
    incomeMonthly: null,
    billsMonthly: null,
    cashSaved: null,
    creditBand: null,
  };
}

export function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, "");
  if (!cleaned) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0 || value > 10_000_000) return null;
  return Math.round(value);
}

export function buildStrategy(picture: MoneyPicture, goal: InvestingGoal | null): StrategyPlan {
  const leftover = picture.incomeMonthly !== null && picture.billsMonthly !== null
    ? picture.incomeMonthly - picture.billsMonthly
    : null;
  const thinCash = picture.cashSaved !== null && picture.billsMonthly !== null && picture.billsMonthly > 0
    ? picture.cashSaved < picture.billsMonthly * 3
    : false;
  const tight = leftover !== null && leftover < Math.max(200, (picture.incomeMonthly ?? 0) * 0.1);
  const creditFirst = picture.creditBand === "building" || picture.creditBand === "fair";
  const unevenWork = picture.employment === "student" || picture.employment === "between_jobs" || picture.employment === "part_time";
  const room = leftover !== null && leftover >= 0 && !tight && !thinCash && !creditFirst && !unevenWork;

  const topicIds = room && goal === "growth"
    ? ["expectations", "thesis", "valuation"]
    : room && goal === "income"
      ? ["cash", "valuation", "dilution"]
      : ["cash", "diversification", "valuation"];

  const steps: StrategyStep[] = [];
  if (picture.employment) {
    steps.push({
      title: EMPLOYMENT_LABELS[picture.employment],
      body: employmentBody(picture.employment),
    });
  }
  if (leftover !== null) {
    steps.push({
      title: leftover < 0 ? "Bills are ahead of income" : "What is left after bills",
      body: leftover < 0
        ? `Bills are about ${formatUsd(Math.abs(leftover))} more than the monthly income you entered. The first problems are about cash and bills. A share price does not pay those bills.`
        : `About ${formatUsd(leftover)} is left after the bills you entered. That leftover is the part a later lesson can talk about. It is not a pile of cash and not a reason to chase a price.`,
    });
  }
  if (thinCash && picture.cashSaved !== null && picture.billsMonthly !== null) {
    steps.push({
      title: "Cash on hand is thin",
      body: `You entered ${formatUsd(picture.cashSaved)} saved and about ${formatUsd(picture.billsMonthly)} in monthly bills. That is under three months of bills. The scroll starts with cash before price.`,
    });
  }
  if (picture.creditBand && picture.creditBand !== "skip") {
    steps.push({
      title: `Credit: ${CREDIT_LABELS[picture.creditBand]}`,
      body: creditBody(picture.creditBand),
    });
  }
  if (steps.length === 0) {
    steps.push({
      title: "Add a few numbers",
      body: "Employment, monthly income, monthly bills, cash saved, and a credit band are enough. Leave any box blank. Nothing here is sent to a bureau or a bank.",
    });
  }

  return {
    headline: headlineFor(tight, leftover, room, goal),
    picture: pictureLine(picture, leftover),
    steps: steps.slice(0, 4),
    topicIds,
    boundary: BOUNDARY,
  };
}

function headlineFor(tight: boolean, leftover: number | null, room: boolean, goal: InvestingGoal | null): string {
  if (leftover !== null && leftover < 0) return "Start with bills and cash.";
  if (tight) return "Start with what is left after the bills.";
  if (room && goal === "growth") return "There is room to study what a price already expects.";
  if (room && goal === "income") return "There is room to study cash paid out.";
  return "The next problems follow the picture you typed.";
}

function pictureLine(picture: MoneyPicture, leftover: number | null): string {
  const parts: string[] = [];
  if (picture.employment) parts.push(EMPLOYMENT_LABELS[picture.employment]);
  if (picture.incomeMonthly !== null) parts.push(`${formatUsd(picture.incomeMonthly)} in`);
  if (picture.billsMonthly !== null) parts.push(`${formatUsd(picture.billsMonthly)} in bills`);
  if (leftover !== null && leftover >= 0) parts.push(`${formatUsd(leftover)} left`);
  if (picture.creditBand && picture.creditBand !== "skip") parts.push(`credit ${CREDIT_LABELS[picture.creditBand].toLowerCase()}`);
  if (parts.length === 0) return "No money picture yet. The feed still uses your goal and any practice you missed.";
  return parts.join(" · ");
}

function employmentBody(status: EmploymentStatus): string {
  if (status === "student") return "A student paycheck is often uneven. The path starts with what is left after bills, then with whether one bad month hits everything.";
  if (status === "part_time") return "Part-time pay can move around. Cash and bills come before a lesson about what a price already expects.";
  if (status === "between_jobs") return "Between jobs, the first problems are cash on hand and bills. A price story can wait.";
  return "Full-time pay is steadier than a gig, and it can still be spoken for by bills. The path still starts from what is left.";
}

function creditBody(band: Exclude<CreditBand, "skip">): string {
  if (band === "building" || band === "fair") {
    return "A credit score is about the price of borrowing. It is not a grade for whether a business is cheap. While the score is still thin, the scroll stays on cash and bills.";
  }
  if (band === "good") {
    return "A good score usually means borrowing costs less. That fact is separate from the price of a share. The lessons can move on to what a price already expects after cash.";
  }
  return "A strong score is still a borrowing fact. It does not make a famous company a fit, and it does not pick a share.";
}
