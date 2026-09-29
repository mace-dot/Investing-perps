"use client";

import { useState } from "react";
import { useApp } from "@/components/app-state";
import { formatPeriodEnd } from "@/lib/filings/format";
import { GOAL_LABELS, type CompanyMatch, type FilingReading, type InvestingGoal, type ReportSpan, type StatementLine, type StatementSheet } from "@/lib/filings/types";

const GOALS: InvestingGoal[] = ["stability", "growth", "income"];

export function FilingReader() {
  const app = useApp();
  const [goal, setGoal] = useState<InvestingGoal | null>(null);
  const [period, setPeriod] = useState<ReportSpan>("annual");
  const [query, setQuery] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<CompanyMatch[] | null>(null);
  const [reading, setReading] = useState<FilingReading | null>(null);

  if (!app.ready) return <p role="status">Loading filings</p>;
  const selected = goal ?? app.investingGoal;

  async function submit(nextQuery: string) {
    if (!selected) {
      setError("Choose a goal first. The reading compares the filing with that goal.");
      return;
    }
    setPending(true);
    setError(null);
    setMatches(null);
    const form = new FormData();
    form.set("goal", selected);
    form.set("period", period);
    form.set("query", nextQuery);
    if (file) form.set("file", file);
    try {
      const response = await fetch("/api/filings/read", { method: "POST", body: form });
      const body = await response.json().catch(() => null) as { error?: string; kind?: string; matches?: CompanyMatch[]; reading?: FilingReading } | null;
      if (!response.ok || !body) {
        setReading(null);
        setError(body?.error || "The filing could not be read.");
        return;
      }
      if (body.kind === "choose" && body.matches) {
        setReading(null);
        setMatches(body.matches);
        return;
      }
      if (body.kind === "reading" && body.reading) {
        setReading(body.reading);
        return;
      }
      setError("The filing could not be read.");
    } catch {
      setError("The filing could not be read. Check the connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm font-semibold text-plum">A company report, in plain words</p>
      <h1 className="text-4xl">Read a filing</h1>
      <p className="max-w-xl leading-7">
        Type a ticker. You get three numbers first: sales, profit, and cash from the business. The rest of the report stays folded until you open it.
      </p>
      <fieldset>
        <legend className="text-sm font-semibold">Which report?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className={period === "annual" ? "btn-primary" : "btn-quiet"} onClick={() => setPeriod("annual")}>Latest year</button>
          <button type="button" className={period === "quarter" ? "btn-primary" : "btn-quiet"} onClick={() => setPeriod("quarter")}>Latest quarter</button>
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold">Compare it with</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {GOALS.map((id) => (
            <button
              key={id}
              type="button"
              className={selected === id ? "btn-primary" : "btn-quiet"}
              onClick={() => {
                setGoal(id);
                app.setInvestingGoal(id);
              }}
            >
              {GOAL_LABELS[id]}
            </button>
          ))}
        </div>
      </fieldset>
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(query);
        }}
      >
        <label className="text-sm font-semibold">
          Ticker or company name
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={80}
            placeholder="AAPL or Apple"
            className="mt-2 w-full min-h-11 rounded-2xl border border-line bg-card px-3"
          />
        </label>
        <details className="rounded-2xl border border-line bg-card px-3 py-2">
          <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold">Already have the file?</summary>
          <label className="mt-2 block text-sm font-semibold">
            Upload a report. It is not saved.
            <input
              type="file"
              accept=".htm,.html,.txt,.pdf,text/html,text/plain,application/pdf"
              className="mt-2 block w-full text-sm font-normal"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
        </details>
        <button type="submit" className="btn-primary w-fit" disabled={pending || !selected}>
          {pending ? "Reading the filing" : "Read the filing"}
        </button>
      </form>
      <p className="text-sm leading-6 text-muted">
        This is a reading of a filing against a goal you chose. It does not tell you what to do with your money.
      </p>
      {pending ? (
        <p role="status">
          {period === "quarter" ? "Pulling the quarterly report and the three statements." : "Pulling the annual report and the three statements."}
        </p>
      ) : null}
      {error ? <p className="rounded-2xl border border-line bg-card px-4 py-3 text-sm leading-6" role="alert">{error}</p> : null}
      {matches ? (
        <section className="grid gap-2">
          <h2 className="text-2xl">Which company?</h2>
          <p className="leading-7">More than one SEC company matched. Pick the one you meant.</p>
          {matches.map((match) => (
            <button
              key={match.cik}
              type="button"
              className="btn-quiet justify-start"
              onClick={() => {
                setQuery(match.ticker);
                void submit(match.ticker);
              }}
            >
              {match.name} · {match.ticker}
            </button>
          ))}
        </section>
      ) : null}
      {reading ? <ReadingView reading={reading} /> : null}
    </div>
  );
}

const STARTER_LABELS = ["Sales", "Profit or loss", "Cash from running the business"];

function ReadingView({ reading }: { reading: FilingReading }) {
  const starters = STARTER_LABELS.map((label) => reading.sheets.flatMap((sheet) => sheet.lines).find((line) => line.label === label) ?? null);
  return (
    <article className="grid gap-4">
      <header>
        <h2 className="text-3xl">{reading.companyName}{reading.ticker ? ` · ${reading.ticker}` : ""}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          {reading.form ?? "Filing"}
          {reading.periodEnd ? ` · ${reading.periodKind === "quarter" ? "quarter" : "year"} ended ${formatPeriodEnd(reading.periodEnd)}` : ""}
          {reading.filed ? ` · filed ${formatPeriodEnd(reading.filed)}` : ""}
          {" · "}compared with {reading.goalLabel}
        </p>
      </header>
      <p className="rounded-3xl border border-line bg-card p-4 leading-7">{reading.notAdvice}</p>
      <section className="rounded-3xl border border-line bg-card p-4">
        <h3 className="text-2xl">{reading.alignment.headline}</h3>
        <p className="mt-2 leading-7">{reading.alignment.detail}</p>
      </section>
      <section>
        <h3 className="text-2xl">Start here</h3>
        <p className="mt-1 text-sm leading-6 text-muted">Three numbers. Each one is the figure from the report, then the earlier period's own number.</p>
        <div className="mt-3 grid gap-3">
          {STARTER_LABELS.map((label, index) => (
            <StarterCard key={label} label={label} line={starters[index] ?? null} />
          ))}
        </div>
      </section>
      <details className="rounded-3xl border border-line bg-card p-4">
        <summary className="min-h-11 cursor-pointer text-lg font-semibold">All three statements</summary>
        <p className="mt-3 text-sm leading-6 text-muted">{reading.proseNote}</p>
        <p className="mt-3 leading-7">{reading.overview}</p>
        <div className="mt-3 grid gap-3">
          {reading.sheets.map((sheet) => (
            <StatementCard key={sheet.id} sheet={sheet} />
          ))}
        </div>
      </details>
      <details className="rounded-3xl border border-line bg-card p-4">
        <summary className="min-h-11 cursor-pointer text-lg font-semibold">What the numbers can mean</summary>
        <div className="mt-3 grid gap-3">
          {reading.sections.map((section) => (
            <section key={section.id}>
              <h3 className="text-2xl">{section.title}</h3>
              <ul className="mt-2 grid gap-1">
                {section.figures.map((figure) => (
                  <li key={`${section.id}-${figure.label}-${figure.periodEnd}`}>
                    <span className="font-semibold">{figure.value}.</span> {figure.label} {reading.periodKind === "quarter" ? "Quarter ended" : "Year ended"} {figure.periodEnd}.
                  </li>
                ))}
              </ul>
              <p className="mt-3 leading-7">{section.indicates}</p>
              <p className="mt-2 text-sm leading-6 text-muted">Where this can mislead: {section.mislead}</p>
            </section>
          ))}
        </div>
      </details>
      <details className="rounded-3xl border border-line bg-card p-4">
        <summary className="min-h-11 cursor-pointer text-lg font-semibold">What the notes say</summary>
        <p className="mt-3 leading-7">{reading.excerptReading}</p>
        <div className="mt-3 grid gap-3">
          {reading.excerpts.map((excerpt) => (
            <blockquote key={excerpt.heading}>
              <p className="text-sm font-semibold text-plum">{excerpt.heading}</p>
              <p className="mt-2 leading-7">{excerpt.text}</p>
            </blockquote>
          ))}
        </div>
      </details>
      {reading.filingUrl ? (
        <p className="break-all text-sm leading-6">
          <a className="font-semibold text-teal" href={reading.filingUrl} target="_blank" rel="noreferrer">
            Open the {reading.form === "10-Q" ? "10-Q" : "10-K"} on the SEC site
          </a>
        </p>
      ) : (
        <p className="text-sm leading-6 text-muted">No SEC link is attached. This reading used the uploaded file only, so standardized totals were not added.</p>
      )}
    </article>
  );
}

function StarterCard({ label, line }: { label: string; line: StatementLine | null }) {
  if (!line) {
    return (
      <section className="rounded-3xl border border-line bg-card p-4">
        <p className="font-semibold">{label}</p>
        <p className="mt-1 text-sm leading-6 text-muted">That line was not in this extract.</p>
      </section>
    );
  }
  return (
    <section className="rounded-3xl border border-line bg-card p-4">
      <p className="font-serif text-3xl">{line.value}</p>
      <p className="mt-1 font-semibold">{label}</p>
      <p className="mt-1 leading-7">{line.means}</p>
      {line.prior ? <p className="mt-1 text-sm leading-6 text-muted">{line.prior}</p> : null}
    </section>
  );
}

function StatementCard({ sheet }: { sheet: StatementSheet }) {
  const [formalOpen, setFormalOpen] = useState(false);
  return (
    <section className="rounded-3xl border border-line bg-card p-4">
      <p className="text-sm font-semibold text-plum">{sheet.kicker}</p>
      <h3 className="mt-1 text-2xl">{sheet.title}</h3>
      <p className="mt-2 leading-7">{sheet.plain}</p>
      {sheet.lines.length === 0 ? (
        <p className="mt-3 text-sm leading-6">This statement was not in the structured figures for that period.</p>
      ) : (
        <ul className="mt-3 grid gap-3">
          {sheet.lines.map((line) => (
            <li key={line.formal} className="rounded-2xl bg-paper px-3 py-3">
              <p className="font-serif text-3xl">{line.value}</p>
              <p className="mt-1 font-semibold">{line.label}</p>
              <p className="mt-1 leading-7">{line.means}</p>
              {line.prior ? <p className="mt-1 text-sm leading-6 text-muted">{line.prior}</p> : null}
              {formalOpen ? <p className="mt-1 text-sm text-muted">Accounting name: {line.formal}. The name is a label, not evidence.</p> : null}
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="mt-3 min-h-11 text-sm font-semibold text-plum" aria-expanded={formalOpen} onClick={() => setFormalOpen((open) => !open)}>
        {formalOpen ? "Hide the accounting names" : "Show the accounting names"}
      </button>
    </section>
  );
}
