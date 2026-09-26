import { gradeAnswer } from "@/lib/grade";
import { z } from "zod";

const bodySchema = z.object({
  questionId: z.string().min(1).max(80),
  choiceId: z.string().min(1).max(8),
  explanation: z.string().min(1).max(1200),
  confidence: z.enum(["unsure", "somewhat_sure", "very_sure"]),
  hintUsed: z.boolean(),
  answerRevealed: z.boolean(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "The request was not valid JSON." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Check the answer length and the confidence choice." }, { status: 400 });
  }
  const grade = gradeAnswer({
    questionId: parsed.data.questionId,
    choiceId: parsed.data.choiceId,
    explanation: parsed.data.explanation,
    hintUsed: parsed.data.hintUsed,
    answerRevealed: parsed.data.answerRevealed,
    inPublishedWeeklyChallenge: false,
  });
  if (!grade) {
    return Response.json({ error: "That question is not in the sample curriculum." }, { status: 404 });
  }
  return Response.json({
    correct: grade.correct,
    points: grade.decision.points,
    practiceOnly: grade.decision.practiceOnly,
    countsForAccuracy: grade.decision.countsForAccuracy,
    reasons: grade.decision.reasons,
    understood: grade.feedback.understood,
    explanation: grade.feedback.explanation,
    clarifyingQuestion: grade.feedback.clarifyingQuestion,
    ruleOfThumb: grade.ruleOfThumb,
    exception: grade.exception,
    contradicts: grade.feedback.contradictsSelection,
    assessment: grade.feedback.reasoningAssessment,
    misconceptionTag: grade.feedback.misconceptionTag,
    source: "canonical" as const,
    role: grade.role,
    lessonId: grade.lessonId,
  });
}
