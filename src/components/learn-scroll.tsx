"use client";

import Link from "next/link";
import { GOAL_LABELS, type InvestingGoal } from "@/lib/filings/types";
import type { LearnSlide } from "@/lib/learn-feed";

const GOALS: InvestingGoal[] = ["stability", "growth", "income"];

export function LearnScroll({
  slides,
  goal,
  onGoal,
}: {
  slides: LearnSlide[];
  goal: InvestingGoal | null;
  onGoal: (goal: InvestingGoal) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Your goal">
        {GOALS.map((id) => (
          <button
            key={id}
            type="button"
            className={`shrink-0 ${goal === id ? "btn-primary" : "btn-quiet"}`}
            onClick={() => onGoal(id)}
          >
            {GOAL_LABELS[id]}
          </button>
        ))}
      </div>
      <div className="learn-scroll mt-3 min-h-0 flex-1" tabIndex={0} aria-label="Learning scroll">
        {slides.map((slide, index) => (
          <article key={slide.id} className="learn-slide flex flex-col rounded-3xl border border-line bg-card p-5">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <p className="text-sm font-semibold text-plum">
                {index + 1} of {slides.length + 1} · {slide.topicName} · {slide.minutes} min
              </p>
              <h2 className="mt-3 text-3xl leading-tight">{slide.title}</h2>
              <p className="mt-3 text-base leading-7">{slide.hook}</p>
              <p className="mt-3 text-sm leading-6 text-muted">{slide.why}</p>
            </div>
            <Link href={slide.href} className="btn-primary mt-4 shrink-0">{slide.action}</Link>
          </article>
        ))}
        <article className="learn-slide flex flex-col rounded-3xl border border-line bg-ink p-5 text-white">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <p className="text-sm font-semibold text-white/80">Not connected</p>
            <h2 className="mt-3 text-3xl leading-tight text-white">Your brokerage stays where it is</h2>
            <p className="mt-3 text-base leading-7 text-white/90">
              This app customizes the next lesson to your goal. It does not log in to a brokerage, sync an account, or tell you what to buy or sell. Linking an account is not available.
            </p>
          </div>
          <Link href="/filings" className="btn-quiet mt-4 w-fit shrink-0 bg-white">Read a filing instead</Link>
        </article>
      </div>
    </div>
  );
}
