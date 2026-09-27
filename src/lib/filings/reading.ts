import { changeRatio, latest, prior, type StatementSet } from "@/lib/filings/facts";
import { describeChange, formatPeriodEnd, formatUsd } from "@/lib/filings/format";
import { excerptsFromPlain, joinedExcerptText } from "@/lib/filings/excerpts";
import { GOAL_LABELS, NOT_ADVICE, type FilingExcerpt, type FilingReading, type FilingSection, type FilingSource, type InvestingGoal } from "@/lib/filings/types";

export type ReadingInput = {
  companyName: string;
  ticker: string | null;
  cik: string | null;
  form: string | null;
  filed: string | null;
  filingUrl: string | null;
  goal: InvestingGoal;
  source: FilingSource;
  statements: StatementSet;
  plainText: string;
};

export function buildFilingReading(input: ReadingInput): FilingReading {
  const excerpts = input.plainText.trim() ? excerptsFromPlain(input.plainText) : [];
  const sections = buildSections(input.statements);
  const alignment = alignWithGoal(input.goal, input.statements, excerpts, sections.length > 0);
  const period = latest(input.statements.revenue)?.end ?? latest(input.statements.profit)?.end ?? latest(input.statements.assets)?.end ?? null;
  return {
    source: input.source,
    companyName: input.companyName,
    ticker: input.ticker,
    cik: input.cik,
    form: input.form,
    periodEnd: period,
    filed: input.filed,
    filingUrl: input.filingUrl,
    goal: input.goal,
    goalLabel: GOAL_LABELS[input.goal],
    overview: overview(input, sections, alignment.headline, period),
    sections,
    excerpts,
    excerptReading: excerptReading(excerpts, input.source),
    alignment,
    proseSource: "canonical",
    proseNote: "This wording comes from the filing figures and the passages quoted above. A model did not write it.",
    notAdvice: NOT_ADVICE,
  };
}

function overview(input: ReadingInput, sections: FilingSection[], headline: string, period: string | null): string {
  const who = input.ticker ? `${input.companyName} (${input.ticker})` : input.companyName;
  const when = period ? ` for the year ended ${formatPeriodEnd(period)}` : "";
  if (sections.length === 0) {
    return `${who}${when}. This reading uses the words in the document. Standardized statement totals were not pulled, so dollar totals are not invented here. ${headline}`;
  }
  const sales = sectionSentence(sections, "sales");
  const profit = sectionSentence(sections, "profit");
  const cash = sectionSentence(sections, "cash");
  const capex = sectionSentence(sections, "capex");
  return [`${who}${when}.`, sales, profit, cash, capex, headline].filter(Boolean).join(" ");
}

function sectionSentence(sections: FilingSection[], id: string): string | null {
  const section = sections.find((item) => item.id === id);
  const figure = section?.figures[0];
  if (!section || !figure) return null;
  const verb = section.title === "Sales" ? "were" : "was";
  return `${section.title} ${verb} ${figure.value}.`;
}

function excerptReading(excerpts: FilingExcerpt[], source: FilingSource): string {
  if (excerpts.length === 0) {
    return source === "upload"
      ? "The uploaded file did not include a discussion passage this reader could separate from the rest of the text."
      : "The annual report text was not available, so this reading uses the standardized numbers only. A plan or a warning is not assumed.";
  }
  const where = source === "upload" || source === "edgar-and-upload"
    ? "The passages below are from the file you uploaded."
    : "The passages below are from the company's annual report on the SEC site.";
  return `${where} They are shortened to the sentences that mention spending, plans, debt, dividends, customers, or a going-concern warning. A plan is mentioned only when those sentences say it.`;
}

function buildSections(statements: StatementSet): FilingSection[] {
  const sections: FilingSection[] = [];
  const sales = moneySection(statements.revenue, "sales", "Sales", "Customers paid this much over the year.");
  if (sales) {
    sections.push({
      ...sales,
      indicates: salesChangeIndicates(statements),
      mislead: "A bigger sales number is not profit, and it is not cash in the drawer. One strong year can also be a one-time order.",
    });
  }
  const profit = moneySection(statements.profit, "profit", "Profit", "This is what the report says was left after that year's costs.");
  if (profit) {
    sections.push({
      ...profit,
      indicates: profitIndicates(statements),
      mislead: "Profit on the report can include sales that have not been collected yet. It is not the same as spendable cash.",
    });
  }
  const cash = moneySection(statements.operatingCash, "cash", "Cash from running the business", "This is cash that came in from the operation itself, not from borrowing or from selling shares.");
  if (cash) {
    sections.push({
      ...cash,
      indicates: cashIndicates(statements),
      mislead: "One year of cash can be moved by timing, such as collecting old bills or delaying payments. It is not a forecast.",
    });
  }
  const capex = moneySection(statements.capex, "capex", "Capital spending", "This is cash spent on buildings, equipment, and similar long-term tools. People sometimes shorten that to capex.");
  if (capex) {
    sections.push({
      ...capex,
      indicates: capexIndicates(statements),
      mislead: "Some of this spending only replaces worn tools. Some of it is a new bet. The total alone does not say which.",
    });
  }
  const bills = billsSection(statements);
  if (bills) sections.push(bills);
  const debt = debtSection(statements);
  if (debt) sections.push(debt);
  return sections;
}

function moneySection(points: StatementSet["revenue"], id: string, title: string, label: string): Pick<FilingSection, "id" | "title" | "figures"> | null {
  const current = latest(points);
  if (!current) return null;
  const previous = prior(points);
  const figures = [
    { label, value: formatUsd(current.value), periodEnd: formatPeriodEnd(current.end) },
  ];
  if (previous) {
    const change = describeChange(current.value, previous.value);
    figures.push({
      label: change ? `Compared with the prior year, ${change}.` : "Prior year",
      value: formatUsd(previous.value),
      periodEnd: formatPeriodEnd(previous.end),
    });
  }
  return { id, title, figures };
}

function salesChangeIndicates(statements: StatementSet): string {
  const ratio = changeRatio(statements.revenue);
  if (ratio === null) return "Sales are the money customers paid. The figure does not say how much the company kept.";
  if (ratio > 0.03) return "Customers paid more than in the prior year. That is a larger year of business. It still does not say how much was kept, or whether the gain lasts.";
  if (ratio < -0.03) return "Customers paid less than in the prior year. A smaller year of sales is a weaker top line. It does not, by itself, say the company is failing or that the price of the shares is wrong.";
  return "Sales were about the same as the prior year. A steady top line is not the same thing as a sturdy profit or spare cash.";
}

function profitIndicates(statements: StatementSet): string {
  const current = latest(statements.profit);
  if (!current) return "Profit was not available in the structured figures.";
  if (current.value < 0) return "The report shows a loss for the year. The company spent more than it kept in that accounting result. A loss is not the same fact as running out of cash, and a profit is not the same fact as spare cash.";
  const sales = latest(statements.revenue);
  if (sales && sales.value > 0) {
    const kept = current.value / sales.value;
    return `Profit was positive. About ${Math.round(kept * 100)} cents of profit were recorded for each dollar of sales. That is what the report kept on paper, not what an owner could take home.`;
  }
  return "Profit was positive for the year. That is the accounting result, not a pile of cash and not a reason to buy the shares.";
}

function cashIndicates(statements: StatementSet): string {
  const cash = latest(statements.operatingCash);
  const profit = latest(statements.profit);
  if (!cash) return "Cash from the business was not in the structured figures.";
  if (cash.value < 0) return "The operation used more cash than it brought in. Profit, if any, did not show up as spare cash from running the business.";
  if (profit && profit.value > 0 && cash.value < profit.value * 0.5) {
    return `Cash from the business was ${formatUsd(cash.value)}, well below profit of ${formatUsd(profit.value)}. The report looks healthier than the cash coming out of the operation.`;
  }
  if (profit && profit.value > 0 && cash.value >= profit.value) {
    return "Cash from running the business was at least as large as profit. In this year, the profit was not just a paper result.";
  }
  return "Cash from running the business was positive. Compare it with profit before you treat the profit line as money the owner could take.";
}

function capexIndicates(statements: StatementSet): string {
  const ratio = changeRatio(statements.capex);
  const current = latest(statements.capex);
  const sales = latest(statements.revenue);
  const share = current && sales && sales.value > 0 ? current.value / sales.value : null;
  const shareText = share !== null ? ` That was about ${Math.round(share * 100)} cents of capital spending for each dollar of sales.` : "";
  if (ratio !== null && ratio > 0.2) {
    return `Capital spending jumped from the prior year.${shareText} More cash is tied up in long-term tools before the result of that spending is known.`;
  }
  if (ratio !== null && ratio < -0.2) {
    return `Capital spending fell from the prior year.${shareText} Less cash went into long-term tools. That can mean a quieter build year, or that the company is putting off replacement. The total does not say which.`;
  }
  return `Capital spending is cash that leaves before you know what the new tools will earn.${shareText}`;
}

function billsSection(statements: StatementSet): FilingSection | null {
  const assets = latest(statements.currentAssets);
  const bills = latest(statements.currentLiabilities);
  if (!assets || !bills || bills.value === 0) return null;
  const ratio = assets.value / bills.value;
  return {
    id: "bills",
    title: "Near-term bills",
    figures: [
      { label: "Resources due within a year.", value: formatUsd(assets.value), periodEnd: formatPeriodEnd(assets.end) },
      { label: "Bills due within a year.", value: formatUsd(bills.value), periodEnd: formatPeriodEnd(bills.end) },
    ],
    indicates: ratio >= 1
      ? `Near-term resources cover near-term bills, at about ${ratio.toFixed(1)} dollars of resources for each dollar of those bills. That is a snapshot, not a promise that the bills get paid.`
      : `Near-term bills are larger than near-term resources, at about ${ratio.toFixed(1)} dollars of resources for each dollar of those bills. The company may need cash from elsewhere to cover the next year of bills.`,
    mislead: "A comfortable snapshot can still hide a bill that comes due in one lump. Inventory is counted as a resource even when it sells slowly.",
  };
}

function debtSection(statements: StatementSet): FilingSection | null {
  const debt = latest(statements.longTermDebt);
  const assets = latest(statements.assets);
  const liabilities = latest(statements.liabilities);
  if (!debt && !liabilities) return null;
  const figures = [];
  if (debt) figures.push({ label: "Long-term debt.", value: formatUsd(debt.value), periodEnd: formatPeriodEnd(debt.end) });
  if (liabilities && assets && assets.value > 0) {
    figures.push({
      label: "All obligations compared with all assets.",
      value: `${Math.round((liabilities.value / assets.value) * 100)} percent`,
      periodEnd: formatPeriodEnd(liabilities.end),
    });
  }
  const heavy = liabilities && assets && assets.value > 0 && liabilities.value / assets.value > 0.75;
  return {
    id: "debt",
    title: "Borrowing",
    figures,
    indicates: heavy
      ? "A large share of the assets is matched by what the company owes. Lenders, not owners, have a claim on much of the business. That is a heavier burden than a company that owns most of its assets free of debt."
      : "Borrowing is part of how the business is funded. The dollar amount is the claim. It is not, by itself, a verdict that the debt is reckless or safe.",
    mislead: "Debt can be cheap and well matched to steady cash, or it can come due at a bad time. The total does not show the interest rate or the due date.",
  };
}

export function alignWithGoal(
  goal: InvestingGoal,
  statements: StatementSet,
  excerpts: FilingExcerpt[],
  hasStatements: boolean,
): FilingReading["alignment"] {
  const text = joinedExcerptText(excerpts);
  const quote = planQuote(excerpts);
  const goingConcern = /going concern/i.test(text) && !/no substantial doubt|not raise substantial doubt/i.test(text);
  const capexJump = (changeRatio(statements.capex) ?? 0) > 0.2;
  const salesFell = (changeRatio(statements.revenue) ?? 0) < -0.05;
  const salesGrew = (changeRatio(statements.revenue) ?? 0) > 0.05;
  const profit = latest(statements.profit)?.value ?? null;
  const operatingCash = latest(statements.operatingCash)?.value ?? null;
  const cashGap = profit !== null && profit > 0 && operatingCash !== null && operatingCash < profit * 0.5;
  const currentAssets = latest(statements.currentAssets)?.value;
  const currentLiabilities = latest(statements.currentLiabilities)?.value;
  const thinBills = currentAssets !== undefined && currentLiabilities !== undefined && currentLiabilities > 0 && currentAssets < currentLiabilities;
  const dividend = latest(statements.dividends)?.value ?? null;
  const mentionsDividend = /\bdividends?\b/i.test(text) || (dividend !== null && Math.abs(dividend) > 0);

  const tensions: string[] = [];
  const fits: string[] = [];
  if (!hasStatements) {
    tensions.push("Standardized statement totals were not pulled, so this comparison uses the document's words rather than a full set of dollar totals.");
  }

  if (goal === "stability") {
    if (capexJump) {
      const current = latest(statements.capex);
      const previous = prior(statements.capex);
      tensions.push(
        current && previous
          ? `Capital spending was ${formatUsd(current.value)}, ${describeChange(current.value, previous.value)}. You asked for safer, more stable holdings. A jump in cash spent on long-term tools is a less steady pattern, because the money is committed before the payoff is known.`
          : "Capital spending rose sharply. That is a less steady pattern for a safer goal, because the cash is committed before the payoff is known.",
      );
    }
    if (quote) {
      tensions.push(`The filing discusses a rollout or a platform in its own words: "${quote}" That kind of plan spends cash ahead of the result. It is a weaker match for a safer, more stable goal.`);
    }
    if (goingConcern) tensions.push("The filing uses the words \"going concern,\" which raises a question about whether the business can keep operating. That conflicts with a safer goal.");
    if (profit !== null && profit < 0) tensions.push(`The latest year shows a loss of ${formatUsd(profit)}. A loss is a weaker match for a goal that wants a steadier business.`);
    if (cashGap && operatingCash !== null && profit !== null) {
      tensions.push(`Profit was ${formatUsd(profit)}, while cash from running the business was ${formatUsd(operatingCash)}. The paper result is ahead of the cash.`);
    }
    if (thinBills) tensions.push("Bills due within a year are larger than resources due within a year. A steadier goal usually wants those near-term bills covered.");
    if (tensions.length === 0 && hasStatements && profit !== null && profit > 0 && operatingCash !== null && operatingCash > 0 && !salesFell) {
      fits.push("The latest year shows profit and cash from the business, without a sharp jump in capital spending in the figures that were available. That is closer to a steadier pattern. It is still one year, not a promise.");
    }
  }

  if (goal === "growth") {
    if (salesFell) tensions.push("Sales fell from the prior year. A goal that accepts swings in exchange for expansion still needs the business to be getting larger, and this year did not show that.");
    if (profit !== null && profit < 0 && !salesGrew) tensions.push("The year shows a loss without a clear rise in sales. That is a weak match for a growth goal, which is looking for expansion rather than a shrinking result.");
    if (salesGrew && capexJump) fits.push("Sales rose, and capital spending rose with them. That can fit a goal that accepts bigger swings while the company spends ahead. It does not show that the spending will pay off.");
    else if (salesGrew) fits.push("Sales rose from the prior year. That is the direction a growth goal is looking for. One year of higher sales is not a durable expansion.");
    if (quote) fits.push(`The filing's own words mention a rollout or a platform: "${quote}" Read that as a plan, not as evidence the plan has worked.`);
  }

  if (goal === "income") {
    if (mentionsDividend && dividend !== null && Math.abs(dividend) > 0) {
      fits.push(`The filing shows cash paid out as dividends of ${formatUsd(Math.abs(dividend))}. An income goal cares about cash that leaves the company for the owner. The payment can be cut later.`);
    } else if (mentionsDividend) {
      fits.push("The document mentions a dividend. Confirm the dollar amount in the statement of cash flows before you treat it as money that reached owners.");
    } else {
      tensions.push("The figures and passages read here do not show a dividend. An income goal wants cash paid out. Capital spending, if it is rising, uses cash that is then not paid out.");
    }
    if (capexJump && !(dividend !== null && Math.abs(dividend) > 0)) {
      tensions.push("Capital spending jumped. More cash is going into long-term tools instead of being paid out.");
    }
  }

  const headline = headlineFor(goal, tensions, fits);
  const detail = [...tensions, ...fits].join(" ") || "The filing did not supply enough of a contrast to push this goal one way or the other.";
  return { headline, detail, tensions, fits };
}

function headlineFor(goal: InvestingGoal, tensions: string[], fits: string[]): string {
  if (goal === "stability") {
    if (tensions.length > 0) return "A weaker match for a safer, more stable goal.";
    if (fits.length > 0) return "Closer to a steadier pattern.";
    return "Mixed for a safer, more stable goal.";
  }
  if (goal === "growth") {
    if (tensions.length > 0 && fits.length === 0) return "A weaker match for a goal that wants expansion.";
    if (fits.length > 0 && tensions.length === 0) return "Closer to an expansion pattern.";
    return "Mixed for a goal that accepts swings in exchange for growth.";
  }
  if (tensions.length > 0 && fits.length === 0) return "A weaker match for a goal that wants cash paid out.";
  if (fits.length > 0 && tensions.length === 0) return "The filing shows cash paid out.";
  return "Mixed for a goal that wants cash paid out.";
}

export function planQuote(excerpts: FilingExcerpt[]): string | null {
  const found = excerpts
    .filter((excerpt) => /roll out|rollout|high tech platforms/i.test(excerpt.text))
    .sort((a, b) => quoteRank(b.text) - quoteRank(a.text))[0];
  if (!found) return null;
  const text = found.text.replace(/\s+/g, " ").trim();
  return text.length > 280 ? `${text.slice(0, 277)}...` : text;
}

function quoteRank(text: string): number {
  return (/high tech platform/i.test(text) ? 4 : 0) + (/\bplatforms?\b/i.test(text) ? 2 : 0) + (/roll out/i.test(text) ? 1 : 0);
}

export function moneyPhrases(reading: FilingReading): string[] {
  const phrases = new Set<string>();
  for (const section of reading.sections) {
    for (const figure of section.figures) {
      if (figure.value.includes("$")) phrases.add(figure.value);
    }
  }
  const amounts = reading.alignment.detail.match(/\$\d[\d,]*(?:\.\d+)?(?:\s(?:trillion|billion|million))?/g) ?? [];
  for (const amount of amounts) phrases.add(amount);
  return [...phrases];
}
