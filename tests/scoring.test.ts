import { describe, expect, it } from "vitest";
import { gradeAnswer } from "@/lib/grade";
import { commitScoredAttempt, decideSubmission, publicRanking, sharedRank } from "@/lib/scoring";

describe("answer evaluation", () => {
  it("marks company B correct and company A wrong for the first valuation question", () => {
    const right = gradeAnswer({
      questionId: "q-price-whole",
      choiceId: "b",
      explanation: "The whole business B costs 800 million, which is 20 times profit.",
      hintUsed: false,
      answerRevealed: false,
    });
    const wrong = gradeAnswer({
      questionId: "q-price-whole",
      choiceId: "a",
      explanation: "Eight dollars is less than eighty dollars.",
      hintUsed: false,
      answerRevealed: false,
    });
    expect(right?.correct).toBe(true);
    expect(wrong?.correct).toBe(false);
    expect(right?.decision.points).toBe(0);
    expect(right?.decision.reasons.some((reason) => reason.includes("needs review"))).toBe(true);
  });

  it("does not treat a correct guess with a contradictory reason as understanding", () => {
    const grade = gradeAnswer({
      questionId: "q-price-whole",
      choiceId: "b",
      explanation: "Company A is cheaper because the share price is lower.",
      hintUsed: false,
      answerRevealed: false,
    });
    expect(grade?.correct).toBe(true);
    expect(grade?.feedback.contradictsSelection).toBe(true);
    expect(grade?.feedback.reasoningAssessment).toBe("misconception");
  });
});

describe("ranking eligibility", () => {
  it("awards 10 points only for a reviewed weekly question without a hint", () => {
    const decision = decideSubmission({
      choiceId: "b",
      correctChoiceId: "b",
      hintUsed: false,
      answerRevealed: false,
      lessonReviewStatus: "reviewed",
      inPublishedWeeklyChallenge: true,
      alreadyHasScoredAttempt: false,
      alreadyHasAccuracyAttempt: false,
    });
    expect(decision.points).toBe(10);
    expect(decision.countsForRanking).toBe(true);
  });

  it("makes a hinted answer practice-only even when it is correct", () => {
    const decision = decideSubmission({
      choiceId: "b",
      correctChoiceId: "b",
      hintUsed: true,
      answerRevealed: false,
      lessonReviewStatus: "reviewed",
      inPublishedWeeklyChallenge: true,
      alreadyHasScoredAttempt: false,
      alreadyHasAccuracyAttempt: false,
    });
    expect(decision.points).toBe(0);
    expect(decision.practiceOnly).toBe(true);
    expect(decision.countsForAccuracy).toBe(false);
  });

  it("does not award points for confidence or for a second scored try", () => {
    const decision = decideSubmission({
      choiceId: "b",
      correctChoiceId: "b",
      hintUsed: false,
      answerRevealed: false,
      lessonReviewStatus: "reviewed",
      inPublishedWeeklyChallenge: true,
      alreadyHasScoredAttempt: true,
      alreadyHasAccuracyAttempt: true,
    });
    expect(decision.points).toBe(0);
  });

  it("keeps the first scored commit when the same key is submitted twice", () => {
    const store = new Map();
    const first = commitScoredAttempt(store, {
      userId: "u1",
      questionId: "q-price-whole",
      challengeId: "week",
      points: 10,
    });
    const second = commitScoredAttempt(store, {
      userId: "u1",
      questionId: "q-price-whole",
      challengeId: "week",
      points: 10,
    });
    expect(first.inserted).toBe(true);
    expect(second.idempotent).toBe(true);
    expect(second.points).toBe(10);
    expect([...store.values()].reduce((sum, row) => sum + row.points, 0)).toBe(10);
  });

  it("shares ranks and hides people who did not opt in", () => {
    const board = publicRanking([
      { displayName: "Hidden", points: 100, attempted: 2, correct: 2, optedIn: false },
      { displayName: "Ada", points: 20, attempted: 2, correct: 2, optedIn: true },
      { displayName: "Bea", points: 20, attempted: 2, correct: 1, optedIn: true },
      { displayName: "Cam", points: 10, attempted: 2, correct: 1, optedIn: true },
    ]);
    expect(board.map((row) => row.displayName)).toEqual(["Ada", "Bea", "Cam"]);
    expect(board.map((row) => row.rank)).toEqual([1, 1, 3]);
    expect(sharedRank([{ points: 5 }, { points: 5 }]).map((row) => row.rank)).toEqual([1, 1]);
  });
});
