"use client";

import { useState } from "react";
import { useApp } from "@/components/app-state";
import { formatPeriodEnd } from "@/lib/filings/format";
import { GOAL_LABELS, type CompanyMatch, type FilingReading, type InvestingGoal } from "@/lib/filings/types";

const GOALS: InvestingGoal[] = ["stability", "growth", "income"];

export function FilingReader() {
  const app = useApp();
  const [goal, setGoal] = useState<InvestingGoal | null>(null);
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
      <p className="text-sm font-semibold text-plum">SEC filings · not a recommendation</p>
      <h1 className="text-4xl">Read a 10-K</h1>
      <p className="max-w-xl leading-7">
        Enter a ticker or company name and the app pulls the latest annual report from the SEC. You can also upload a 10-K if you already have the file. The upload is not saved. The reading says what the numbers and the notes indicate, then compares that with a goal you choose.
      </p>
      <fieldset>
        <legend className="text-sm font-semibold">What pattern are you comparing this with?</legend>
        <div className="mt-2 grid gap-2">
          {GOALS.map((id) => (
            <label key={id} className="flex min-h-11 items-start gap-2 rounded-2xl border border-line bg-card px-3 py-3">
              <input
                type="radio"
                name="goal"
                className="mt-1"
                checked={selected === id}
                onChange={() => {
                  setGoal(id);
                  app.setInvestingGoal(id);
                }}
              />
              <span>{GOAL_LABELS[id]}</span>
            </label>
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
        <label className="text-sm font-semibold">
          Or upload a 10-K
          <input
            type="file"
            accept=".htm,.html,.txt,.pdf,text/html,text/plain,application/pdf"
            className="mt-2 block w-full text-sm"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <button type="submit" className="btn-primary w-fit" disabled={pending || !selected}>
          {pending ? "Reading the filing" : "Read the filing"}
        </button>
      </form>
      <p className="text-sm leading-6 text-muted">
        This is a reading of a filing against a goal you chose. It does not tell you what to do with your money. A famous company is not evidence that the pattern fits you.
      </p>
      {pending ? <p role="status">Pulling the annual report and the standardized statements.</p> : null}
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

function ReadingView({ reading }: { reading: FilingReading }) {
  return (
    <article className="grid gap-4">
      <header>
        <h2 className="text-3xl">{reading.companyName}{reading.ticker ? ` · ${reading.ticker}` : ""}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          {reading.form ?? "Filing"}
          {reading.periodEnd ? ` · year ended ${formatPeriodEnd(reading.periodEnd)}` : ""}
          {reading.filed ? ` · filed ${formatPeriodEnd(reading.filed)}` : ""}
          {" · "}compared with {reading.goalLabel}
        </p>
      </header>
      <p className="rounded-3xl border border-line bg-card p-4 leading-7">{reading.notAdvice}</p>
      <p className="text-lg leading-8">{reading.overview}</p>
      <p className="text-sm leading-6 text-muted">{reading.proseNote}</p>
      <section className="rounded-3xl border border-line bg-card p-4">
        <h3 className="text-2xl">{reading.alignment.headline}</h3>
        <p className="mt-2 leading-7">{reading.alignment.detail}</p>
      </section>
      <div className="grid gap-3">
        {reading.sections.map((section) => (
          <section key={section.id} className="rounded-3xl border border-line bg-card p-4">
            <h3 className="text-2xl">{section.title}</h3>
            <ul className="mt-2 grid gap-1">
              {section.figures.map((figure) => (
                <li key={`${section.id}-${figure.label}-${figure.periodEnd}`}>
                  <span className="font-semibold">{figure.value}.</span> {figure.label} Year ended {figure.periodEnd}.
                </li>
              ))}
            </ul>
            <p className="mt-3 leading-7">{section.indicates}</p>
            <p className="mt-2 text-sm leading-6 text-muted">Where this can mislead: {section.mislead}</p>
          </section>
        ))}
      </div>
      <section>
        <h3 className="text-2xl">What the notes and discussion say</h3>
        <p className="mt-2 leading-7">{reading.excerptReading}</p>
        <div className="mt-3 grid gap-3">
          {reading.excerpts.map((excerpt) => (
            <blockquote key={excerpt.heading} className="rounded-3xl border border-line bg-card p-4">
              <p className="text-sm font-semibold text-plum">{excerpt.heading}</p>
              <p className="mt-2 leading-7">{excerpt.text}</p>
            </blockquote>
          ))}
        </div>
      </section>
      {reading.filingUrl ? (
        <p className="break-all text-sm leading-6">
          <a className="font-semibold text-teal" href={reading.filingUrl} target="_blank" rel="noreferrer">Open the 10-K on the SEC site</a>
        </p>
      ) : (
        <p className="text-sm leading-6 text-muted">No SEC link is attached. This reading used the uploaded file only, so standardized totals were not added.</p>
      )}
    </article>
  );
}
