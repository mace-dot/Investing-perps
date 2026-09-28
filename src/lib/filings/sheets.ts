import { latest, prior, type ReportPeriod, type StatementSet } from "@/lib/filings/facts";
import { describeChange, formatUsd } from "@/lib/filings/format";
import type { StatementSheet } from "@/lib/filings/types";

export function buildSheets(statements: StatementSet, period: ReportPeriod): StatementSheet[] {
  const previous = period === "quarter" ? "Previous quarter" : "Previous year";
  return [
    incomeSheet(statements, previous),
    balanceSheet(statements, previous),
    cashSheet(statements, previous),
  ];
}

function incomeSheet(statements: StatementSet, previous: string): StatementSheet {
  return {
    id: "income",
    kicker: "Income statement",
    title: "What customers paid, and what was left",
    plain: "This is the story of the period. It starts with money from customers and ends with profit or a loss. Profit here is still not the same as cash.",
    lines: [
      line(statements.revenue, "Sales", "Revenue", "Money customers paid during the period.", previous),
      line(statements.grossProfit, "Left after the direct cost", "Gross profit", "Sales minus the cost of the goods or service itself. Other costs can still come out after this.", previous),
      line(statements.operatingIncome, "Left from the main work", "Operating income", "What the main business kept before interest and other side items. Reports do not all draw this line the same way.", previous),
      line(statements.profit, "Profit or loss", "Net income", "What the report says was left after the period's costs. A positive number is profit. A negative number is a loss.", previous),
    ].filter((item) => item !== null),
  };
}

function balanceSheet(statements: StatementSet, previous: string): StatementSheet {
  return {
    id: "balance",
    kicker: "Balance sheet",
    title: "What it had, and what it owed, on one day",
    plain: "This is a snapshot, not a whole year. It lists resources and obligations on the last day of the period.",
    lines: [
      line(statements.cash, "Cash", "Cash and cash equivalents", "Money the report counts as cash on that day.", previous),
      line(statements.currentAssets, "Resources due within about a year", "Current assets", "Cash, bills customers still owe, and other resources expected within about a year. Inventory is included even if it sells slowly.", previous),
      line(statements.assets, "All resources", "Total assets", "Everything the report counts the company as having on that day.", previous),
      line(statements.currentLiabilities, "Bills due within about a year", "Current liabilities", "Payments the company expects to make within about a year.", previous),
      line(statements.longTermDebt, "Long-term debt", "Long-term debt", "Borrowed money that is not all due within the year. The interest rate and the due date are not in this one number.", previous),
      line(statements.liabilities, "All obligations", "Total liabilities", "What the company owes, added together.", previous),
      line(statements.equity, "Owners' remaining claim", "Stockholders' equity", "Assets minus obligations, as the report assigns that remainder to owners. It is not the stock price.", previous),
    ].filter((item) => item !== null),
  };
}

function cashSheet(statements: StatementSet, previous: string): StatementSheet {
  return {
    id: "cash",
    kicker: "Cash flow statement",
    title: "Where cash came from, and where it went",
    plain: "This is the cash diary. A negative number means cash went out. Profit can look fine while this page shows cash leaving.",
    lines: [
      line(statements.operatingCash, "Cash from running the business", "Operating cash flow", "Cash collected from the operation itself, not from borrowing and not from selling new shares.", previous),
      line(statements.capex, "Cash spent on buildings and equipment", "Capital expenditures", "Cash spent on long-term tools. People sometimes shorten this to capex. The total does not say which part only replaces worn tools.", previous),
      signedLine(statements.investingCash, "Cash from buying and selling long-term items", "Investing cash flow", previous),
      signedLine(statements.financingCash, "Cash from borrowing or paying owners", "Financing cash flow", previous),
      line(statements.dividends, "Cash paid out to owners", "Dividends", "Cash the company paid to owners. It can be cut later. A missing line means this extract did not show a dividend.", previous),
    ].filter((item) => item !== null),
  };
}

function line(
  points: StatementSet["revenue"],
  label: string,
  formal: string,
  means: string,
  previousLabel: string,
): StatementSheet["lines"][number] | null {
  const current = latest(points);
  if (!current) return null;
  const previous = prior(points);
  const change = previous ? describeChange(current.value, previous.value) : null;
  return {
    label,
    formal,
    value: formatUsd(current.value),
    prior: previous ? `${previousLabel}: ${formatUsd(previous.value)}${change ? `, ${change}` : ""}.` : null,
    means,
  };
}

function signedLine(
  points: StatementSet["revenue"],
  label: string,
  formal: string,
  previousLabel: string,
): StatementSheet["lines"][number] | null {
  const current = latest(points);
  if (!current) return null;
  const means = current.value < 0
    ? "Cash went out. Read the size, then ask whether it was a repayment, a payout, or a purchase."
    : "Cash came in. Read the size, then ask whether it was new borrowing or something sold.";
  return line(points, label, formal, means, previousLabel);
}
