import { answerKey } from "./curriculum/answer-keys";
import { lessonById, LESSONS, questionById } from "./curriculum/public-lessons";
import { assessExplanation, type LocalAssessment } from "./explanation";
import { decideSubmission, type Confidence, type SubmissionDecision } from "./scoring";

export type Grade = {
  correct: boolean;
  decision: SubmissionDecision;
  feedback: LocalAssessment;
  ruleOfThumb: string;
  exception: string;
  lessonId: string;
  role: "initial" | "transfer";
};

export function gradeAnswer(input: {
  questionId: string;
  choiceId: string;
  explanation: string;
  hintUsed: boolean;
  answerRevealed: boolean;
  inPublishedWeeklyChallenge?: boolean;
  alreadyHasScoredAttempt?: boolean;
  alreadyHasAccuracyAttempt?: boolean;
}): Grade | null {
  const found = questionById(input.questionId);
  const key = answerKey(input.questionId);
  if (!found || !key) return null;
  const correct = input.choiceId === key.correctChoiceId;
  const decision = decideSubmission({
    choiceId: input.choiceId,
    correctChoiceId: key.correctChoiceId,
    hintUsed: input.hintUsed,
    answerRevealed: input.answerRevealed,
    lessonReviewStatus: found.lesson.reviewStatus,
    inPublishedWeeklyChallenge: input.inPublishedWeeklyChallenge ?? false,
    alreadyHasScoredAttempt: input.alreadyHasScoredAttempt ?? false,
    alreadyHasAccuracyAttempt: input.alreadyHasAccuracyAttempt ?? false,
  });
  const feedback = assessExplanation({
    choiceId: input.choiceId,
    explanation: input.explanation,
    key,
    correct,
  });
  return {
    correct,
    decision,
    feedback,
    ruleOfThumb: key.ruleOfThumb,
    exception: key.exception,
    lessonId: found.lesson.id,
    role: found.question.role,
  };
}

export function nextLessonId(currentId: string): string | null {
  const index = LESSONS.findIndex((lesson) => lesson.id === currentId);
  if (index < 0 || index === LESSONS.length - 1) return null;
  return LESSONS[index + 1]?.id ?? null;
}

export function lessonExists(id: string): boolean {
  return Boolean(lessonById(id));
}

export type { Confidence };
