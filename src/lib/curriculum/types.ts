export type TopicId =
  | "valuation"
  | "diversification"
  | "cash"
  | "expectations"
  | "dilution"
  | "thesis";

export type Choice = {
  id: string;
  text: string;
};

export type PublicQuestion = {
  id: string;
  role: "initial" | "transfer";
  scenario: string;
  prompt: string;
  choices: Choice[];
  hint: string;
};

export type SourceRef = {
  title: string;
  note: string;
};

export type PublicLesson = {
  id: string;
  topicId: TopicId;
  title: string;
  streetTitle: string;
  estimatedMinutes: number;
  curriculumVersion: string;
  reviewStatus: "needs_review";
  framework: string;
  principle: string;
  workedExample: string;
  whenUseful: string;
  whenItFails: string;
  ruleOfThumb: string;
  exception: string;
  formalName: string;
  jargon: { term: string; plain: string }[];
  sources: SourceRef[];
  misconceptionTags: string[];
  initial: PublicQuestion;
  transfer: PublicQuestion;
};

export type Topic = {
  id: TopicId;
  name: string;
  plain: string;
};

export const CURRICULUM_VERSION = "2026-09-26.1";

export const TOPICS: Topic[] = [
  {
    id: "valuation",
    name: "Share price versus business valuation",
    plain: "The sticker on one share is not the price of the whole business.",
  },
  {
    id: "diversification",
    name: "Diversification and correlated risks",
    plain: "Owning more things only helps when they do not all fail together.",
  },
  {
    id: "cash",
    name: "Revenue, profit, and cash flow",
    plain: "Money customers promise, profit on paper, and cash in the drawer are different.",
  },
  {
    id: "expectations",
    name: "Expectations and valuation",
    plain: "A fine business can still be a high price if everyone already expects great news.",
  },
  {
    id: "dilution",
    name: "Dilution and ownership",
    plain: "New shares can shrink your slice even when you keep every share you had.",
  },
  {
    id: "thesis",
    name: "Investment theses and disconfirming evidence",
    plain: "A belief needs the fact that would make you drop it.",
  },
];
