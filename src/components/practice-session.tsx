"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp, type Confidence, type StoredAttempt } from "@/components/app-state";
import { ErrorState, Loading } from "@/components/feed-screen";
import { lessonById, LESSONS } from "@/lib/curriculum/public-lessons";
import { frameworksForTopic } from "@/lib/curriculum/frameworks";
import type { PublicQuestion } from "@/lib/curriculum/types";

type Feedback = {
  correct: boolean;
  points: number;
  practiceOnly: boolean;
  reasons: string[];
  understood: string;
  explanation: string;
  clarifyingQuestion: string | null;
  ruleOfThumb: string;
  exception: string;
  contradicts: boolean;
  assessment: string;
  misconceptionTag: string | null;
  source: "canonical" | "model";
  role: "initial" | "transfer";
};

export function PracticeList() {
  const app = useApp();
  if (!app.ready) return <Loading label="Loading practice" />;
  return (
    <div>
      <p className="text-sm font-semibold text-plum">About three to five minutes</p>
      <h1 className="mt-1 text-4xl">Practice</h1>
      <p className="mt-2 max-w-xl leading-7 text-muted">
        Start with the first lesson. You do not need an account, and you do not need to know any ratios. Each lesson is sample curriculum marked needs review.
      </p>
      <Link href="/frameworks" className="mt-3 inline-flex min-h-11 items-center font-semibold text-teal">
        Read the ideas in plain words
      </Link>
      <ol className="mt-4 grid gap-3">
        {LESSONS.map((lesson, index) => {
          const attempts = app.attempts.filter((attempt) => attempt.lessonId === lesson.id);
          const initial = attempts.some((attempt) => attempt.role === "initial");
          const transfer = attempts.some((attempt) => attempt.role === "transfer");
          const status = initial && transfer ? "Completed" : initial || transfer ? "In progress" : "Not started";
          return (
            <li key={lesson.id}>
              <Link href={`/practice/${lesson.id}`} className="block rounded-3xl border border-line bg-card p-4 shadow-sm">
                <p className="text-sm text-muted">
                  {index + 1}. {lesson.topicId} · {status}
                </p>
                <h2 className="mt-1 text-2xl">{lesson.streetTitle}</h2>
                <p className="mt-2 text-sm leading-6">{lesson.principle}</p>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function PracticeSession({ lessonId }: { lessonId: string }) {
  const app = useApp();
  const lesson = lessonById(lessonId);
  const [step, setStep] = useState<"choice" | "reason" | "confidence" | "feedback" | "done">("choice");
  const [phase, setPhase] = useState<"initial" | "transfer">("initial");
  const [choiceId, setChoiceId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState("");
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [coach, setCoach] = useState<string | null>(null);
  const [coachSource, setCoachSource] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formalOpen, setFormalOpen] = useState(false);

  if (!lesson || !app.ready) {
    if (!app.ready) return <Loading label="Opening the lesson" />;
    return <ErrorState title="That lesson is not in the sample set." body="Go back to practice and pick a lesson that is listed." />;
  }
  const currentLesson = lesson;

  const question: PublicQuestion = phase === "initial" ? lesson.initial : lesson.transfer;
  const related = frameworksForTopic(lesson.topicId);

  async function submit() {
    if (!choiceId || !confidence) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/practice/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          choiceId,
          explanation,
          confidence,
          hintUsed,
          answerRevealed: false,
        }),
      });
      if (!response.ok) throw new Error("The grader did not respond.");
      const body = (await response.json()) as Feedback & { lessonId: string };
      setFeedback(body);
      setStep("feedback");
      const attempt: StoredAttempt = {
        questionId: question.id,
        lessonId: currentLesson.id,
        role: question.role,
        choiceId,
        explanation,
        confidence,
        correct: body.correct,
        hintUsed,
        contradicts: body.contradicts,
        countsForAccuracy: !hintUsed,
        points: body.points,
        misconceptionTag: body.misconceptionTag,
        at: Date.now(),
      };
      app.recordAttempt(attempt);
    } catch {
      setError("Feedback could not be loaded. Your draft is still on this screen. Nothing was marked correct.");
    } finally {
      setPending(false);
    }
  }

  async function askCoach(action: "simpler" | "example" | "why" | "fails") {
    setCoach("Thinking from the lesson notes…");
    setCoachSource(null);
    try {
      const response = await fetch("/api/ai/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: currentLesson.id,
          action,
          explanation,
          submitted: step === "feedback" || step === "done",
        }),
      });
      const body = (await response.json()) as { text?: string; source?: string; error?: string };
      if (!response.ok || !body.text) throw new Error(body.error || "Coach unavailable");
      setCoach(body.text);
      setCoachSource(body.source ?? "canonical");
    } catch {
      setCoach("The coach could not be reached. Use the lesson text on this page. Nothing here is a personalized model reply.");
      setCoachSource("canonical");
    }
  }

  function continueAfterFeedback() {
    if (phase === "initial") {
      setPhase("transfer");
      setStep("choice");
      setChoiceId(null);
      setExplanation("");
      setConfidence(null);
      setHintUsed(false);
      setShowHint(false);
      setFeedback(null);
      setCoach(null);
      return;
    }
    setStep("done");
  }

  const next = LESSONS[LESSONS.findIndex((item) => item.id === lesson.id) + 1];

  return (
    <div className="grid gap-4">
      <p className="text-sm font-semibold text-plum">Sample lesson · needs review · not expert-reviewed</p>
      <h1 className="text-4xl">{lesson.streetTitle}</h1>
      <p className="text-lg leading-8">{lesson.principle}</p>
      <section className="rounded-3xl border border-line bg-card p-4">
        <h2 className="text-xl">A smaller example first</h2>
        <p className="mt-2 leading-7">{lesson.workedExample}</p>
        <p className="mt-3 text-sm leading-6"><span className="font-semibold">Useful when. </span>{lesson.whenUseful}</p>
        <p className="mt-2 text-sm leading-6"><span className="font-semibold">Where it fails. </span>{lesson.whenItFails}</p>
        <button type="button" className="mt-3 min-h-11 text-sm font-semibold text-plum" onClick={() => setFormalOpen((open) => !open)} aria-expanded={formalOpen}>
          {formalOpen ? "Hide the textbook name" : "Show the textbook name"}
        </button>
        {formalOpen ? (
          <div className="mt-2 text-sm leading-6">
            <p>{lesson.formalName}</p>
            <ul className="mt-2 grid gap-1">
              {lesson.jargon.map((item) => (
                <li key={item.term}>
                  <span className="font-semibold">{item.term}.</span> {item.plain}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-quiet" onClick={() => askCoach("simpler")}>Explain more simply</button>
        <button type="button" className="btn-quiet" onClick={() => askCoach("example")}>Walk through the example</button>
        <button type="button" className="btn-quiet" onClick={() => askCoach("why")}>Why is my reasoning wrong?</button>
        <button type="button" className="btn-quiet" onClick={() => askCoach("fails")}>When does this rule fail?</button>
      </div>
      {coach ? (
        <p className="rounded-3xl bg-card p-4 text-sm leading-6" role="status">
          {coachSource === "model" ? "Model note, based only on this lesson. " : "Canonical lesson note, not a personalized model reply. "}
          {coach}
        </p>
      ) : null}

      {step !== "done" ? (
        <section className="rounded-3xl border border-line bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold text-plum">{phase === "initial" ? "First question" : "Transfer question"}</p>
          <p className="mt-2 leading-7">{question.scenario}</p>
          <h2 className="mt-3 text-2xl">{question.prompt}</h2>
          <fieldset className="mt-3 grid gap-2" disabled={step === "feedback" || pending}>
            <legend className="sr-only">Choices</legend>
            {question.choices.map((choice) => (
              <label key={choice.id} className="flex min-h-11 items-start gap-3 rounded-2xl border border-line px-3 py-3">
                <input
                  type="radio"
                  name="choice"
                  className="mt-1"
                  checked={choiceId === choice.id}
                  onChange={() => {
                    setChoiceId(choice.id);
                    if (step === "choice") setStep("reason");
                  }}
                />
                <span>{choice.text}</span>
              </label>
            ))}
          </fieldset>
          {step !== "choice" ? (
            <label className="mt-4 block text-sm font-semibold">
              Why?
              <textarea
                value={explanation}
                onChange={(event) => setExplanation(event.target.value)}
                maxLength={1200}
                rows={4}
                disabled={step === "feedback" || pending}
                className="mt-2 w-full rounded-2xl border border-line bg-paper p-3 text-base"
                placeholder="Use the numbers or the facts in the story. A short hunch is fine."
              />
            </label>
          ) : null}
          {step === "reason" || step === "confidence" || step === "feedback" ? (
            <div className="mt-3">
              <p className="text-sm font-semibold">How sure are you? This is private and does not add points.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ["unsure", "Unsure"],
                    ["somewhat_sure", "Somewhat sure"],
                    ["very_sure", "Very sure"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    disabled={step === "feedback" || pending}
                    className={`min-h-11 rounded-full px-4 ${confidence === id ? "bg-ink text-white" : "bg-paper"}`}
                    onClick={() => {
                      setConfidence(id);
                      setStep((current) => (current === "feedback" ? current : "confidence"));
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {!showHint ? (
              <button
                type="button"
                className="btn-quiet"
                onClick={() => {
                  const ok = window.confirm("Opening the hint makes this question practice-only. It will not count toward rankings.");
                  if (!ok) return;
                  setShowHint(true);
                  setHintUsed(true);
                }}
              >
                Hint
              </button>
            ) : (
              <p className="text-sm leading-6">Hint: {question.hint} This question is now practice-only.</p>
            )}
            <button type="button" className="btn-primary" disabled={!choiceId || !confidence || explanation.trim().length < 1 || pending || step === "feedback"} onClick={submit}>
              {pending ? "Checking" : "Submit"}
            </button>
          </div>
          {error ? <p className="mt-3 text-sm text-danger" role="alert">{error}</p> : null}
        </section>
      ) : null}

      {feedback && step === "feedback" ? (
        <section className="rounded-3xl border border-line bg-card p-4" role="status">
          <p className="text-sm font-semibold text-plum">
            {feedback.source === "model" ? "Model feedback, checked against the lesson." : "Canonical feedback. The model was not used."}
          </p>
          <h2 className="mt-1 text-2xl">{feedback.correct ? "The choice matches the key." : "The choice does not match the key."}</h2>
          {feedback.contradicts ? <p className="mt-2 leading-7">The written reason argues against the choice you selected. A matching choice is not the same as understanding.</p> : null}
          <p className="mt-3 leading-7"><span className="font-semibold">What came through. </span>{feedback.understood}</p>
          <p className="mt-2 leading-7"><span className="font-semibold">Rule of thumb. </span>{feedback.ruleOfThumb}</p>
          <p className="mt-2 leading-7"><span className="font-semibold">Boundary. </span>{feedback.exception}</p>
          <button type="button" className="mt-3 min-h-11 text-sm font-semibold text-teal" aria-expanded={detailOpen} onClick={() => setDetailOpen((open) => !open)}>
            {detailOpen ? "Hide the fuller explanation" : "Show the fuller explanation"}
          </button>
          {detailOpen ? <p className="mt-2 leading-7">{feedback.explanation}</p> : null}
          {feedback.clarifyingQuestion ? <p className="mt-2 text-sm leading-6">Next question to sit with: {feedback.clarifyingQuestion}</p> : null}
          <p className="mt-3 text-sm leading-6 text-muted">
            {feedback.practiceOnly
              ? `Practice only. ${feedback.reasons[0] ?? "This lesson is still needs review, so it cannot change a public ranking."}`
              : `Ranking points from this answer: ${feedback.points}.`}
            {" "}Confidence was not scored.
          </p>
          <button type="button" className="btn-primary mt-4" onClick={continueAfterFeedback}>
            {phase === "initial" ? "Try the transfer question" : "See what to practice next"}
          </button>
        </section>
      ) : null}

      {step === "done" ? (
        <section className="rounded-3xl border border-line bg-card p-4">
          <h2 className="text-2xl">Progress on this lesson</h2>
          <p className="mt-2 leading-7">You submitted both questions. Retries stay available and do not add ranking points. This sample is not on a public board.</p>
          {feedback?.misconceptionTag ? (
            <button type="button" className="btn-quiet mt-3" onClick={() => app.markTagReviewed(feedback.misconceptionTag!)}>
              Mark this concept for another look
            </button>
          ) : null}
          {next ? (
            <p className="mt-4">
              <Link href={`/practice/${next.id}`} className="btn-primary">Next: {next.streetTitle}</Link>
            </p>
          ) : (
            <p className="mt-4 text-sm">You reached the end of the sample path.</p>
          )}
        </section>
      ) : null}

      {related.length > 0 ? (
        <p className="text-sm leading-6 text-muted">
          Quietly using: {related.map((item) => item.attributedTo).join(" · ")}. A famous name is not evidence for a financial claim.
        </p>
      ) : null}
      <ul className="text-sm leading-6 text-muted">
        {lesson.sources.map((source) => (
          <li key={source.title}>{source.title}. {source.note}</li>
        ))}
      </ul>
    </div>
  );
}
