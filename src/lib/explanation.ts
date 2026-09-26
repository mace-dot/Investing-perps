export type ReasoningAssessment = "sound" | "partial" | "misconception" | "unclear";

export type ExplanationKey = {
  correctChoiceId: string;
  canonicalExplanation: string;
  ruleOfThumb: string;
  exception: string;
  understoodIfCorrect: string;
  missingIfWrong: string;
  misconceptionByChoice: Record<string, string | null>;
  /** If any of these appear, the explanation is at least partly on the idea. */
  supportPhrases: string[];
  /** Correct choice plus one of these, unless a support phrase is also present, means the reason fights the answer. */
  contradictionPhrases: string[];
};

export type LocalAssessment = {
  reasoningAssessment: ReasoningAssessment;
  misconceptionTag: string | null;
  understood: string;
  explanation: string;
  clarifyingQuestion: string | null;
  contradictsSelection: boolean;
  source: "canonical";
};

function includesAny(text: string, phrases: string[]): boolean {
  const haystack = text.toLowerCase();
  return phrases.some((phrase) => haystack.includes(phrase.toLowerCase()));
}

export function assessExplanation(input: {
  choiceId: string;
  explanation: string;
  key: ExplanationKey;
  correct: boolean;
}): LocalAssessment {
  const text = input.explanation.trim();
  const tag = input.key.misconceptionByChoice[input.choiceId] ?? null;
  const supported = text.length > 0 && includesAny(text, input.key.supportPhrases);
  const hitsContradiction = includesAny(text, input.key.contradictionPhrases);
  const contradictsSelection = input.correct && hitsContradiction && !supported;

  if (text.length < 12) {
    return {
      reasoningAssessment: "unclear",
      misconceptionTag: input.correct ? null : tag,
      understood: input.correct
        ? "You selected the answer that fits the facts, but the written reason is too short to show why."
        : "There is not enough written reasoning yet to see which part of the idea is clear.",
      explanation: input.key.canonicalExplanation,
      clarifyingQuestion: "What comparison did you make, and which numbers did you use?",
      contradictsSelection: false,
      source: "canonical",
    };
  }

  if (contradictsSelection) {
    return {
      reasoningAssessment: "misconception",
      misconceptionTag: tag ?? "selection_and_reason_disagree",
      understood: "The selected choice matches the answer key, but the written reason argues for a different idea.",
      explanation: `A correct selection is not the same as understanding. ${input.key.canonicalExplanation}`,
      clarifyingQuestion: "Which number did you actually compare: the sticker price of one share, or the price of the whole business?",
      contradictsSelection: true,
      source: "canonical",
    };
  }

  if (!input.correct) {
    return {
      reasoningAssessment: "misconception",
      misconceptionTag: tag,
      understood: "You gave a reason, and part of the situation is in view.",
      explanation: `${input.key.missingIfWrong} ${input.key.canonicalExplanation}`,
      clarifyingQuestion: null,
      contradictsSelection: false,
      source: "canonical",
    };
  }

  if (!supported) {
    return {
      reasoningAssessment: "partial",
      misconceptionTag: null,
      understood: input.key.understoodIfCorrect,
      explanation: `The choice fits, and the reason does not yet name the comparison that makes it fit. ${input.key.canonicalExplanation}`,
      clarifyingQuestion: "What two numbers did you put side by side?",
      contradictsSelection: false,
      source: "canonical",
    };
  }

  return {
    reasoningAssessment: "sound",
    misconceptionTag: null,
    understood: input.key.understoodIfCorrect,
    explanation: input.key.canonicalExplanation,
    clarifyingQuestion: null,
    contradictsSelection: false,
    source: "canonical",
  };
}
