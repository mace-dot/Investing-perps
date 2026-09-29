"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/app-state";
import { GOAL_LABELS, type InvestingGoal } from "@/lib/filings/types";
import {
  CREDIT_LABELS,
  EMPLOYMENT_LABELS,
  buildStrategy,
  parseMoney,
  type CreditBand,
  type EmploymentStatus,
} from "@/lib/strategy";

const JOBS = Object.keys(EMPLOYMENT_LABELS) as EmploymentStatus[];
const BANDS = Object.keys(CREDIT_LABELS) as CreditBand[];
const GOALS: InvestingGoal[] = ["stability", "growth", "income"];

export function StrategyScreen() {
  const app = useApp();
  const [income, setIncome] = useState("");
  const [bills, setBills] = useState("");
  const [saved, setSaved] = useState("");
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!app.ready || seeded) return;
    setIncome(app.moneyPicture.incomeMonthly === null ? "" : String(app.moneyPicture.incomeMonthly));
    setBills(app.moneyPicture.billsMonthly === null ? "" : String(app.moneyPicture.billsMonthly));
    setSaved(app.moneyPicture.cashSaved === null ? "" : String(app.moneyPicture.cashSaved));
    setSeeded(true);
  }, [app.ready, seeded, app.moneyPicture]);

  if (!app.ready) return <p role="status">Loading your strategy</p>;

  const plan = buildStrategy(app.moneyPicture, app.investingGoal);

  function setAmount(field: "incomeMonthly" | "billsMonthly" | "cashSaved", raw: string, setter: (value: string) => void) {
    setter(raw);
    app.setMoneyPicture({ ...app.moneyPicture, [field]: parseMoney(raw) });
  }

  return (
    <div className="grid max-w-xl gap-5">
      <div>
        <p className="text-sm font-semibold text-plum">Your path · stays on this device</p>
        <h1 className="mt-1 text-4xl">Strategy</h1>
        <p className="mt-2 leading-7">
          Type the picture of your month. The sideways feed uses it to choose the next problem. A credit band is a choice you make here. Nothing on this page is sent to a credit bureau or a bank.
        </p>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">Work</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {JOBS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={app.moneyPicture.employment === id}
              className={app.moneyPicture.employment === id ? "btn-primary" : "btn-quiet"}
              onClick={() => app.setMoneyPicture({ ...app.moneyPicture, employment: id })}
            >
              {EMPLOYMENT_LABELS[id]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">What you want the lessons to follow</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {GOALS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={app.investingGoal === id}
              className={app.investingGoal === id ? "btn-primary" : "btn-quiet"}
              onClick={() => app.setInvestingGoal(id)}
            >
              {GOAL_LABELS[id]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3">
        <MoneyField
          label="Monthly income"
          hint="What comes in during a typical month, before you sort the bills."
          value={income}
          onChange={(value) => setAmount("incomeMonthly", value, setIncome)}
        />
        <MoneyField
          label="Monthly bills"
          hint="Rent, food, phone, loans, and the other payments that repeat."
          value={bills}
          onChange={(value) => setAmount("billsMonthly", value, setBills)}
        />
        <MoneyField
          label="Cash saved"
          hint="Money you could use if a paycheck were late. Leave it blank if you would rather not say."
          value={saved}
          onChange={(value) => setAmount("cashSaved", value, setSaved)}
        />
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">Credit band</legend>
        <p className="mt-1 text-sm leading-6 text-muted">
          This is the price of borrowing. It is not a grade for whether a share is cheap. Pick the band that feels closest, or skip it.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {BANDS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={app.moneyPicture.creditBand === id}
              className={app.moneyPicture.creditBand === id ? "btn-primary" : "btn-quiet"}
              onClick={() => app.setMoneyPicture({ ...app.moneyPicture, creditBand: id })}
            >
              {CREDIT_LABELS[id]}
            </button>
          ))}
        </div>
      </fieldset>

      <section className="rounded-3xl border border-line bg-card p-4">
        <p className="text-sm font-semibold text-plum">{plan.picture}</p>
        <h2 className="mt-2 text-2xl">{plan.headline}</h2>
        <ol className="mt-3 grid gap-3">
          {plan.steps.map((step) => (
            <li key={step.title}>
              <p className="font-semibold">{step.title}</p>
              <p className="mt-1 leading-7">{step.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm leading-6 text-muted">{plan.boundary}</p>
      </section>

      <Link href="/" className="btn-primary w-fit">See the problems in that order</Link>
    </div>
  );
}

function MoneyField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <input
        inputMode="decimal"
        value={value}
        maxLength={16}
        placeholder="$0"
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full min-h-11 rounded-2xl border border-line bg-card px-3 font-normal"
      />
      <span className="mt-1 block font-normal leading-6 text-muted">{hint}</span>
    </label>
  );
}
