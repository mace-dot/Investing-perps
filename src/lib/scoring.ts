export type Confidence = "unsure" | "somewhat_sure" | "very_sure";
export type ReviewStatus = "needs_review" | "reviewed";
export type QuestionRole = "initial" | "transfer";

export const POINTS_PER_CORRECT_ELIGIBLE_ANSWER = 10;
export const MAX_POINTS_PER_LESSON = 20;

export type SubmissionInput = {
  choiceId: string;
  correctChoiceId: string;
  hintUsed: boolean;
  answerRevealed: boolean;
  lessonReviewStatus: ReviewStatus;
  inPublishedWeeklyChallenge: boolean;
  alreadyHasScoredAttempt: boolean;
  alreadyHasAccuracyAttempt: boolean;
};

export type SubmissionDecision = {
  correct: boolean;
  countsForRanking: boolean;
  countsForAccuracy: boolean;
  points: number;
  practiceOnly: boolean;
  reasons: string[];
};

/**
 * Ranking points and accuracy are decided here, never by the language model
 * and never from a client-supplied total.
 */
export function decideSubmission(input: SubmissionInput): SubmissionDecision {
  const correct = input.choiceId === input.correctChoiceId;
  const reasons: string[] = [];

  if (input.hintUsed) {
    reasons.push("A hint was opened before submission, so this question is practice-only.");
  }
  if (input.answerRevealed) {
    reasons.push("The answer was revealed before submission, so this question is practice-only.");
  }
  if (!input.inPublishedWeeklyChallenge) {
    reasons.push("This question is not part of the published weekly challenge, so it does not affect rankings.");
  }
  if (input.lessonReviewStatus !== "reviewed") {
    reasons.push("This lesson is still marked needs review, so it cannot count on a public ranking.");
  }
  if (input.alreadyHasScoredAttempt) {
    reasons.push("A scored attempt already exists. Later tries stay available for learning and add no points.");
  }

  const rankingGateOpen =
    !input.hintUsed &&
    !input.answerRevealed &&
    input.inPublishedWeeklyChallenge &&
    input.lessonReviewStatus === "reviewed" &&
    !input.alreadyHasScoredAttempt;

  const accuracyGateOpen = !input.hintUsed && !input.answerRevealed && !input.alreadyHasAccuracyAttempt;

  return {
    correct,
    countsForRanking: rankingGateOpen,
    countsForAccuracy: accuracyGateOpen,
    points: rankingGateOpen && correct ? POINTS_PER_CORRECT_ELIGIBLE_ANSWER : 0,
    practiceOnly: !rankingGateOpen,
    reasons,
  };
}

export type ScoredAttemptRecord = {
  userId: string;
  questionId: string;
  challengeId: string;
  points: number;
};

export type CommitResult = {
  inserted: boolean;
  points: number;
  idempotent: boolean;
};

/**
 * Application-side twin of the database unique constraint.
 * The first scored commit wins. A repeat returns the original points.
 */
export function commitScoredAttempt(
  store: Map<string, ScoredAttemptRecord>,
  attempt: ScoredAttemptRecord,
): CommitResult {
  const key = `${attempt.userId}:${attempt.questionId}:${attempt.challengeId}`;
  const existing = store.get(key);
  if (existing) {
    return { inserted: false, points: existing.points, idempotent: true };
  }
  store.set(key, attempt);
  return { inserted: true, points: attempt.points, idempotent: false };
}

export function sharedRank<T extends { points: number }>(rows: T[]): (T & { rank: number })[] {
  const sorted = [...rows].sort((a, b) => b.points - a.points || 0);
  let rank = 0;
  let previous: number | null = null;
  return sorted.map((row, index) => {
    if (previous === null || row.points !== previous) {
      rank = index + 1;
      previous = row.points;
    }
    return { ...row, rank };
  });
}

export type RankingRow = {
  displayName: string;
  points: number;
  attempted: number;
  correct: number;
  optedIn: boolean;
};

export function publicRanking(rows: RankingRow[]) {
  return sharedRank(rows.filter((row) => row.optedIn));
}

export function accuracyLabel(correct: number, attempted: number): string {
  if (attempted <= 0) return "No eligible questions yet";
  return `${correct} of ${attempted} eligible answers`;
}
