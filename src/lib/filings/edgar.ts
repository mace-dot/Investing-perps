import { rowsFromTickerFile, resolveCompany, archivesUrl, latestAnnualFiling, type TickerRow } from "@/lib/filings/companies";
import { htmlToPlain } from "@/lib/filings/excerpts";
import { emptyStatements, statementSetFromFacts, type CompanyFacts } from "@/lib/filings/facts";
import { buildFilingReading } from "@/lib/filings/reading";
import type { CompanyMatch, FilingReading, InvestingGoal } from "@/lib/filings/types";

export class EdgarError extends Error {}

type CacheEntry<T> = { at: number; value: T };

let tickerCache: CacheEntry<TickerRow[]> | null = null;
const factsCache = new Map<string, CacheEntry<CompanyFacts>>();

function secUserAgent(env: NodeJS.ProcessEnv): string {
  const configured = env.SEC_USER_AGENT?.trim();
  if (configured) return configured;
  return "Investing Reps educational reader admin@example.com";
}

async function secFetch(url: string, fetchImpl: typeof fetch, env: NodeJS.ProcessEnv): Promise<Response> {
  try {
    return await fetchImpl(url, {
      headers: {
        "User-Agent": secUserAgent(env),
        Accept: "application/json,text/html;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new EdgarError("The SEC did not answer in time. Try again in a moment.");
  }
}

async function secJson(url: string, fetchImpl: typeof fetch, env: NodeJS.ProcessEnv): Promise<unknown> {
  const response = await secFetch(url, fetchImpl, env);
  if (response.status === 403 || response.status === 429) {
    throw new EdgarError("The SEC refused the request. Set SEC_USER_AGENT to your name and a contact email, then try again.");
  }
  if (!response.ok) throw new EdgarError("The SEC did not return that file.");
  return response.json();
}

export async function loadTickers(fetchImpl: typeof fetch, env: NodeJS.ProcessEnv): Promise<TickerRow[]> {
  const caching = fetchImpl === fetch;
  if (caching && tickerCache && Date.now() - tickerCache.at < 12 * 60 * 60 * 1000) return tickerCache.value;
  const payload = await secJson("https://www.sec.gov/files/company_tickers.json", fetchImpl, env);
  const rows = rowsFromTickerFile(payload);
  if (rows.length === 0) throw new EdgarError("The SEC company list came back empty.");
  if (caching) tickerCache = { at: Date.now(), value: rows };
  return rows;
}

export async function loadFacts(cik: string, fetchImpl: typeof fetch, env: NodeJS.ProcessEnv): Promise<CompanyFacts> {
  const caching = fetchImpl === fetch;
  const cached = factsCache.get(cik);
  if (caching && cached && Date.now() - cached.at < 15 * 60 * 1000) return cached.value;
  const payload = await secJson(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, fetchImpl, env);
  const facts = payload as CompanyFacts;
  if (caching) factsCache.set(cik, { at: Date.now(), value: facts });
  return facts;
}

async function loadNarrative(cik: string, fetchImpl: typeof fetch, env: NodeJS.ProcessEnv): Promise<{
  plain: string;
  form: string;
  filed: string;
  filingUrl: string;
} | null> {
  let submissions: unknown;
  try {
    submissions = await secJson(`https://data.sec.gov/submissions/CIK${cik}.json`, fetchImpl, env);
  } catch {
    return null;
  }
  const filing = latestAnnualFiling(submissions);
  if (!filing) return null;
  const filingUrl = archivesUrl(cik, filing.accession, filing.primaryDocument);
  try {
    const response = await secFetch(filingUrl, fetchImpl, env);
    if (!response.ok) return { plain: "", form: "10-K", filed: filing.filed, filingUrl };
    const length = Number(response.headers.get("content-length") || 0);
    if (length > 6_000_000) return { plain: "", form: "10-K", filed: filing.filed, filingUrl };
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 6_000_000) return { plain: "", form: "10-K", filed: filing.filed, filingUrl };
    const raw = new TextDecoder().decode(bytes);
    const plain = /<html|<p\b|<div\b/i.test(raw) ? htmlToPlain(raw) : raw;
    return { plain: plain.slice(0, 180_000), form: "10-K", filed: filing.filed, filingUrl };
  } catch {
    return { plain: "", form: "10-K", filed: filing.filed, filingUrl };
  }
}

export async function pullFiling(input: {
  query: string;
  goal: InvestingGoal;
  uploadText?: string;
  fetchImpl?: typeof fetch;
  env?: NodeJS.ProcessEnv;
}): Promise<{ kind: "choose"; matches: CompanyMatch[] } | { kind: "reading"; reading: FilingReading }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const env = input.env ?? process.env;
  const tickers = await loadTickers(fetchImpl, env);
  const resolved = resolveCompany(tickers, input.query);
  if (resolved.kind === "none") {
    throw new EdgarError("No public company on the SEC list matched that name. Try the ticker symbol.");
  }
  if (resolved.kind === "many") {
    return {
      kind: "choose",
      matches: resolved.rows.map((row) => ({ ticker: row.ticker, name: row.name, cik: row.cik })),
    };
  }

  const facts = await loadFacts(resolved.row.cik, fetchImpl, env);
  const narrative = await loadNarrative(resolved.row.cik, fetchImpl, env);
  const upload = input.uploadText?.trim() ?? "";
  const plainText = upload.length > 80 ? upload : narrative?.plain ?? "";
  const source = upload.length > 80 ? "edgar-and-upload" : "edgar";
  const reading = buildFilingReading({
    companyName: facts.entityName || resolved.row.name,
    ticker: resolved.row.ticker,
    cik: resolved.row.cik,
    form: narrative?.form ?? "10-K",
    filed: narrative?.filed || null,
    filingUrl: narrative?.filingUrl ?? null,
    goal: input.goal,
    source,
    statements: statementSetFromFacts(facts),
    plainText,
  });
  return { kind: "reading", reading };
}

export function readingFromUpload(input: { fileName: string; text: string; goal: InvestingGoal }): FilingReading {
  const companyName = input.fileName.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").trim() || "Uploaded filing";
  return buildFilingReading({
    companyName,
    ticker: null,
    cik: null,
    form: "Uploaded file",
    filed: null,
    filingUrl: null,
    goal: input.goal,
    source: "upload",
    statements: emptyStatements(),
    plainText: input.text,
  });
}
