export type TickerRow = {
  cik: string;
  ticker: string;
  name: string;
};

export function rowsFromTickerFile(payload: unknown): TickerRow[] {
  if (!payload || typeof payload !== "object") return [];
  const rows: TickerRow[] = [];
  for (const row of Object.values(payload as Record<string, { cik_str?: number; ticker?: string; title?: string }>)) {
    if (!row || typeof row.ticker !== "string" || typeof row.title !== "string" || typeof row.cik_str !== "number") continue;
    rows.push({
      cik: String(row.cik_str).padStart(10, "0"),
      ticker: row.ticker.toUpperCase(),
      name: row.title,
    });
  }
  return rows;
}

export function resolveCompany(
  rows: TickerRow[],
  query: string,
): { kind: "none" } | { kind: "one"; row: TickerRow } | { kind: "many"; rows: TickerRow[] } {
  const trimmed = query.trim();
  if (trimmed.length < 1 || trimmed.length > 80) return { kind: "none" };
  const upper = trimmed.toUpperCase();
  const exactTicker = rows.filter((row) => row.ticker === upper);
  if (exactTicker.length === 1) return { kind: "one", row: exactTicker[0] };
  const exactName = rows.filter((row) => row.name.toLowerCase() === trimmed.toLowerCase());
  if (exactName.length === 1) return { kind: "one", row: exactName[0] };

  const lower = trimmed.toLowerCase();
  if (lower.length < 2) return { kind: "none" };
  const ranked = rows
    .map((row) => ({ row, score: scoreCompany(row, lower, upper) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.row.name.localeCompare(b.row.name))
    .slice(0, 8)
    .map((item) => item.row);
  if (ranked.length === 0) return { kind: "none" };
  if (ranked.length === 1) return { kind: "one", row: ranked[0] };
  return { kind: "many", rows: ranked };
}

function scoreCompany(row: TickerRow, lower: string, upper: string): number {
  const name = row.name.toLowerCase();
  if (name.startsWith(lower)) return 80;
  if (name.includes(` ${lower}`)) return 60;
  if (upper.length >= 2 && row.ticker.startsWith(upper)) return 50;
  return 0;
}

export function archivesUrl(cik: string, accession: string, primaryDocument: string): string {
  const numericCik = String(Number(cik));
  const compact = accession.replace(/-/g, "");
  return `https://www.sec.gov/Archives/edgar/data/${numericCik}/${compact}/${primaryDocument}`;
}

export function latestAnnualFiling(payload: unknown): {
  accession: string;
  primaryDocument: string;
  filed: string;
  reportDate: string;
} | null {
  const recent = (payload as { filings?: { recent?: Record<string, string[]> } })?.filings?.recent;
  if (!recent?.form || !recent.accessionNumber || !recent.primaryDocument) return null;
  for (let index = 0; index < recent.form.length; index += 1) {
    if (recent.form[index] !== "10-K") continue;
    const accession = recent.accessionNumber[index];
    const primaryDocument = recent.primaryDocument[index];
    if (!accession || !primaryDocument) return null;
    return {
      accession,
      primaryDocument,
      filed: recent.filingDate?.[index] ?? "",
      reportDate: recent.reportDate?.[index] ?? "",
    };
  }
  return null;
}
