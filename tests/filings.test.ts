import { describe, expect, it } from "vitest";
import { resolveCompany, rowsFromTickerFile } from "@/lib/filings/companies";
import { pullFiling } from "@/lib/filings/edgar";
import { excerptsFromPlain, htmlToPlain } from "@/lib/filings/excerpts";
import { selectAnnual, statementSetFromFacts } from "@/lib/filings/facts";
import { narrationFitsFacts } from "@/lib/filings/narrate";
import { buildFilingReading } from "@/lib/filings/reading";
import { emptyStatements } from "@/lib/filings/facts";
import type { StatementSet } from "@/lib/filings/facts";

const SAMPLE_HTML = `
<html><body>
<p>Item 7. Management's Discussion and Analysis of Financial Condition and Results of Operations 21 Item 8. Financial Statements 28</p>
<h2>Item 7. Management's Discussion and Analysis of Financial Condition and Results of Operations</h2>
<p>The company plans to roll out more high tech platforms over the next two years.</p>
<p>Capital expenditures will rise to support that rollout.</p>
<h2>Item 8. Financial Statements and Supplementary Data</h2>
</body></html>
`;

function year(end: string, start: string, value: number, fp = "FY") {
  return { start, end, val: value, fp, form: "10-K", filed: "2025-02-01" };
}

function statements(): StatementSet {
  const base = emptyStatements();
  return {
    ...base,
    revenue: [
      { end: "2023-12-31", value: 10_000_000_000, filed: "2024-02-01", form: "10-K" },
      { end: "2024-12-31", value: 11_000_000_000, filed: "2025-02-01", form: "10-K" },
    ],
    profit: [
      { end: "2023-12-31", value: 1_200_000_000, filed: "2024-02-01", form: "10-K" },
      { end: "2024-12-31", value: 1_300_000_000, filed: "2025-02-01", form: "10-K" },
    ],
    operatingCash: [
      { end: "2023-12-31", value: 1_500_000_000, filed: "2024-02-01", form: "10-K" },
      { end: "2024-12-31", value: 1_100_000_000, filed: "2025-02-01", form: "10-K" },
    ],
    capex: [
      { end: "2023-12-31", value: 400_000_000, filed: "2024-02-01", form: "10-K" },
      { end: "2024-12-31", value: 1_200_000_000, filed: "2025-02-01", form: "10-K" },
    ],
  };
}

describe("filing facts", () => {
  it("keeps full-year figures and drops a quarter", () => {
    const points = selectAnnual([
      year("2024-12-31", "2024-01-01", 11_000_000_000),
      year("2024-03-31", "2024-01-01", 2_000_000_000, "Q1"),
      { end: "2024-12-31", val: 99, form: "10-Q", fp: "Q4", start: "2024-10-01" },
    ], "duration");
    expect(points).toEqual([
      { end: "2024-12-31", value: 11_000_000_000, filed: "2025-02-01", form: "10-K" },
    ]);
  });

  it("prefers the revenue concept that has a full year", () => {
    const set = statementSetFromFacts({
      facts: {
        "us-gaap": {
          Revenues: { units: { USD: [year("2024-12-31", "2024-10-01", 62_000_000_000)] } },
          RevenueFromContractWithCustomerExcludingAssessedTax: {
            units: { USD: [year("2024-12-31", "2024-01-01", 11_000_000_000)] },
          },
        },
      },
    });
    expect(set.revenue[0]?.value).toBe(11_000_000_000);
  });
});

describe("goal alignment", () => {
  it("flags a capex jump and a platform plan against a safer goal", () => {
    const reading = buildFilingReading({
      companyName: "Sample Platforms",
      ticker: "SAMP",
      cik: "0000000001",
      form: "10-K",
      filed: "2025-02-01",
      filingUrl: "https://www.sec.gov/example",
      goal: "stability",
      source: "edgar",
      statements: statements(),
      plainText: htmlToPlain(SAMPLE_HTML),
    });
    expect(reading.sections.find((section) => section.id === "capex")?.figures[0]?.value).toBe("$1.2 billion");
    expect(reading.alignment.headline).toMatch(/weaker match/i);
    expect(reading.alignment.detail.toLowerCase()).toContain("high tech platforms");
    expect(reading.alignment.detail.toLowerCase()).toContain("capital spending");
    expect(reading.alignment.detail).not.toMatch(/\b(buy|sell|hold)\b/i);
    expect(reading.excerpts.some((excerpt) => excerpt.heading === "Plans and platforms")).toBe(true);
  });

  it("does not invent a platform plan when the filing never says one", () => {
    const reading = buildFilingReading({
      companyName: "Quiet Mills",
      ticker: "QMLL",
      cik: "0000000002",
      form: "10-K",
      filed: "2025-02-01",
      filingUrl: null,
      goal: "stability",
      source: "edgar",
      statements: statements(),
      plainText: "Item 7. Management's Discussion and Analysis of Financial Condition and Results of Operations. The company replaced worn equipment during the year. Item 8. Financial Statements and Supplementary Data.",
    });
    expect(reading.alignment.detail.toLowerCase()).not.toContain("platform");
    expect(reading.alignment.detail.toLowerCase()).toContain("capital spending");
  });

  it("reads an uploaded note without inventing statement totals", () => {
    const reading = buildFilingReading({
      companyName: "Uploaded filing",
      ticker: null,
      cik: null,
      form: "Uploaded file",
      filed: null,
      filingUrl: null,
      goal: "stability",
      source: "upload",
      statements: emptyStatements(),
      plainText: htmlToPlain(SAMPLE_HTML),
    });
    expect(reading.sections).toHaveLength(0);
    expect(reading.alignment.detail.toLowerCase()).toContain("high tech platforms");
    expect(reading.alignment.detail.toLowerCase()).toContain("were not pulled");
    expect(reading.overview).not.toMatch(/\$\d/);
  });
});

describe("company lookup and narration guard", () => {
  it("resolves an exact ticker and asks when several names match", () => {
    const rows = rowsFromTickerFile({
      0: { cik_str: 320193, ticker: "AAPL", title: "Apple Inc." },
      1: { cik_str: 2, ticker: "APLE", title: "Apple Hospitality REIT, Inc." },
    });
    expect(resolveCompany(rows, "aapl")).toMatchObject({ kind: "one", row: { ticker: "AAPL" } });
    expect(resolveCompany(rows, "Apple").kind).toBe("many");
  });

  it("rejects a model reply that invents a figure or gives a trade instruction", () => {
    const reading = buildFilingReading({
      companyName: "Sample Platforms",
      ticker: "SAMP",
      cik: null,
      form: "10-K",
      filed: null,
      filingUrl: null,
      goal: "stability",
      source: "edgar",
      statements: statements(),
      plainText: htmlToPlain(SAMPLE_HTML),
    });
    const quote = reading.excerpts.find((excerpt) => /platforms/i.test(excerpt.text))?.text.slice(0, 40) ?? "";
    expect(narrationFitsFacts(reading, {
      overview: "Sales were $11 billion and capital spending was $1.2 billion.",
      excerptReading: "The note mentions a platform plan.",
      alignmentDetail: `${quote} is a weaker match for a safer goal.`,
      sectionIndicates: [{ id: "capex", indicates: "Capital spending was $1.2 billion, which ties up cash before the result is known." }],
    })).toBe(true);
    expect(narrationFitsFacts(reading, {
      overview: "You should buy this company.",
      excerptReading: "The note mentions a platform plan.",
      alignmentDetail: quote,
      sectionIndicates: [],
    })).toBe(false);
    expect(narrationFitsFacts(reading, {
      overview: "Capital spending was $99 billion.",
      excerptReading: "The note mentions a platform plan.",
      alignmentDetail: quote,
      sectionIndicates: [],
    })).toBe(false);
  });
});

describe("SEC pull", () => {
  it("builds a reading from ticker, statements, and the 10-K text", async () => {
    const html = SAMPLE_HTML;
    const fetchImpl: typeof fetch = async (url) => {
      const target = String(url);
      if (target.includes("company_tickers")) {
        return Response.json({ 0: { cik_str: 1, ticker: "SAMP", title: "Sample Platforms Inc." } });
      }
      if (target.includes("companyfacts")) {
        return Response.json({
          entityName: "Sample Platforms Inc.",
          facts: {
            "us-gaap": {
              RevenueFromContractWithCustomerExcludingAssessedTax: {
                units: { USD: [year("2023-12-31", "2023-01-01", 10_000_000_000), year("2024-12-31", "2024-01-01", 11_000_000_000)] },
              },
              PaymentsToAcquirePropertyPlantAndEquipment: {
                units: { USD: [year("2023-12-31", "2023-01-01", 400_000_000), year("2024-12-31", "2024-01-01", 1_200_000_000)] },
              },
            },
          },
        });
      }
      if (target.includes("submissions")) {
        return Response.json({
          filings: {
            recent: {
              form: ["10-K"],
              accessionNumber: ["0000000001-25-000001"],
              primaryDocument: ["samp.htm"],
              filingDate: ["2025-02-01"],
              reportDate: ["2024-12-31"],
            },
          },
        });
      }
      if (target.endsWith("samp.htm")) return new Response(html, { status: 200, headers: { "content-type": "text/html" } });
      return new Response("missing", { status: 404 });
    };

    const result = await pullFiling({ query: "SAMP", goal: "stability", fetchImpl });
    expect(result.kind).toBe("reading");
    if (result.kind !== "reading") return;
    expect(result.reading.companyName).toBe("Sample Platforms Inc.");
    expect(result.reading.filingUrl).toContain("samp.htm");
    expect(result.reading.alignment.detail.toLowerCase()).toContain("high tech platforms");
    expect(excerptsFromPlain(htmlToPlain(html)).length).toBeGreaterThan(0);
  });
});
