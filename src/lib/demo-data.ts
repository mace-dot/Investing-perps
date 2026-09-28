import { TOPICS } from "./curriculum/types";
import { readingMinutes } from "./curriculum/public-lessons";

export type AuthorKind = "editorial" | "community";
export type PostType = "technique" | "challenge" | "thesis";

export type SourceDraft = {
  title: string;
  url: string;
  date: string;
};

export type DemoPost = {
  id: string;
  type: PostType;
  authorId: string;
  authorName: string;
  authorKind: AuthorKind;
  sample: boolean;
  topicId: string;
  topicName: string;
  title: string;
  createdAt: number;
  editedAt: number | null;
  clubId: string | null;
  lessonId: string | null;
  fields: Record<string, string>;
  sources: SourceDraft[];
  aiAssisted: boolean;
};

export type DemoComment = {
  id: string;
  postId: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  sample: boolean;
  intent: "question" | "evidence" | "assumption" | "note";
  body: string;
  createdAt: number;
};

const topicName = (id: string) => TOPICS.find((topic) => topic.id === id)?.name ?? id;

const day = 86_400_000;
const now = Date.UTC(2026, 8, 20);

function post(input: Omit<DemoPost, "topicName"> & { topicId: string }): DemoPost {
  return { ...input, topicName: topicName(input.topicId) };
}

export const SAMPLE_CLUB = {
  id: "north-quad",
  name: "North Quad Investment Club",
  inviteCode: "CAMPUS-DEMO",
  sample: true,
};

export const SAMPLE_AUTHORS = [
  {
    id: "desk",
    name: "Investing Reps sample desk",
    kind: "editorial" as const,
    bio: "Fictional editorial desk for sample lessons. These notes are marked needs review. They are not expert-reviewed and not a recommendation.",
  },
  {
    id: "jordan",
    name: "Jordan Lee",
    kind: "community" as const,
    bio: "Fictional sample student. Not a real person.",
  },
  {
    id: "sam",
    name: "Sam Okonkwo",
    kind: "community" as const,
    bio: "Fictional sample student. Not a real person.",
  },
  {
    id: "priya",
    name: "Priya Shah",
    kind: "community" as const,
    bio: "Fictional sample student. Not a real person.",
  },
];

export const SAMPLE_POSTS: DemoPost[] = [
  post({
    id: "post-whole-business",
    type: "technique",
    authorId: "desk",
    authorName: "Investing Reps sample desk",
    authorKind: "editorial",
    sample: true,
    topicId: "valuation",
    title: "The sticker is not the whole price",
    createdAt: now - day,
    editedAt: null,
    clubId: null,
    lessonId: "valuation-whole-business",
    aiAssisted: false,
    fields: {
      principle:
        "The sticker on one share is not the price of the business. Multiply the share price by the number of shares. Then compare that whole price with a year of profit.",
      example:
        "A lemonade stand sold for $8 a cup can still be the more expensive business if there are far more cups. The scored drill keeps that arithmetic until after you choose.",
      whenUseful: "When someone calls a stock cheap only because the share price looks small.",
      whenItFails: "A lower comparison with this year’s profit does not make a better investment by itself.",
    },
    sources: [
      {
        title: "The Intelligent Investor, Benjamin Graham",
        url: "https://en.wikipedia.org/wiki/The_Intelligent_Investor",
        date: "1949",
      },
    ],
  }),
  post({
    id: "post-challenge-price",
    type: "challenge",
    authorId: "desk",
    authorName: "Investing Reps sample desk",
    authorKind: "editorial",
    sample: true,
    topicId: "valuation",
    title: "Which business is cheaper relative to its profit?",
    createdAt: now - 2 * day,
    editedAt: null,
    clubId: null,
    lessonId: "valuation-whole-business",
    aiAssisted: false,
    fields: {
      scenario:
        "Two fictional companies earn the same yearly profit. One has a much smaller share price and many more shares.",
      decision: "Choose the lower whole-business price compared with yearly profit, then explain the multiplication.",
      note: "This sample challenge is marked needs review. It does not count on a public ranking until an editor approves the lesson.",
    },
    sources: [],
  }),
  post({
    id: "post-jordan-thesis",
    type: "thesis",
    authorId: "jordan",
    authorName: "Jordan Lee",
    authorKind: "community",
    sample: true,
    topicId: "thesis",
    title: "Campus Cups is a crowded price if the line is already famous",
    createdAt: now - 3 * day,
    editedAt: null,
    clubId: null,
    lessonId: null,
    aiAssisted: false,
    fields: {
      claim:
        "I believe the fictional Campus Cups chain is a popular shop, and popularity alone does not tell me whether the price leaves room to be wrong.",
      evidence:
        "The only facts in this sample are: one campus location, a long morning line, and no published profit figure in the post.",
      assumptions: "I am assuming the line means demand, and that demand has not already been built into a high price.",
      counterargument: "The line could be a one-week novelty, or the price of the business could be modest relative to profit I have not seen.",
      changeMind: "I would drop the caution if two years of store-level profit were high relative to the price paid for the whole business.",
      asOf: "2026-09-20",
    },
    sources: [],
  }),
  post({
    id: "post-sam-airlines",
    type: "technique",
    authorId: "sam",
    authorName: "Sam Okonkwo",
    authorKind: "community",
    sample: true,
    topicId: "diversification",
    title: "Three airlines can be one bet",
    createdAt: now - 4 * day,
    editedAt: null,
    clubId: null,
    lessonId: "diversification-same-storm",
    aiAssisted: false,
    fields: {
      principle: "A longer list is not protection if every name gets hurt by the same event.",
      example: "Three airlines that share fuel, routes, and vacation demand can all suffer when people stop flying.",
      whenUseful: "When a portfolio is described as safe only because it has several tickers.",
      whenItFails: "Different businesses can still fall together in a broad panic. Mixing changes the shared risks. It does not erase risk.",
    },
    sources: [],
  }),
  post({
    id: "post-priya-club",
    type: "thesis",
    authorId: "priya",
    authorName: "Priya Shah",
    authorKind: "community",
    sample: true,
    topicId: "cash",
    title: "The campus paper’s profit is not the cash in the drawer",
    createdAt: now - 5 * day,
    editedAt: null,
    clubId: SAMPLE_CLUB.id,
    lessonId: "cash-profit-is-not-cash",
    aiAssisted: false,
    fields: {
      claim: "I believe the fictional campus paper can report a profit while collecting less cash, if advertisers pay late.",
      evidence: "This sample uses made-up figures only: profit of $3,000 and unpaid ads rising by $2,500. No other changes.",
      assumptions: "I assume no equipment was bought and no depreciation needs to be added back.",
      counterargument: "Late ads might be normal for the season, and the cash might arrive next month.",
      changeMind: "I would relax the claim if the following month’s cash collection covered the unpaid ads.",
      asOf: "2026-09-18",
    },
    sources: [],
  }),
];

export const SAMPLE_COMMENTS: DemoComment[] = [
  {
    id: "comment-1",
    postId: "post-jordan-thesis",
    parentId: null,
    authorId: "sam",
    authorName: "Sam Okonkwo",
    sample: true,
    intent: "assumption",
    body: "This assumes the morning line is the same customers every day. What if it is visitors during one sports weekend?",
    createdAt: now - 2 * day,
  },
  {
    id: "comment-2",
    postId: "post-jordan-thesis",
    parentId: "comment-1",
    authorId: "jordan",
    authorName: "Jordan Lee",
    sample: true,
    intent: "evidence",
    body: "Fair. I do not have a second week of counts. That gap belongs in the assumptions.",
    createdAt: now - day,
  },
];

export function postReadingMinutes(post: DemoPost): number {
  const text = Object.entries(post.fields)
    .filter(([key]) => key !== "essay" && key !== "hook")
    .map(([, value]) => value)
    .join(" ");
  return readingMinutes(text || post.fields.essay || "");
}

export const SAMPLE_RANKING = [
  { rank: 1, displayName: "Sample learner A", points: 40, attempted: 4, correct: 4 },
  { rank: 2, displayName: "Sample learner B", points: 30, attempted: 4, correct: 3 },
  { rank: 2, displayName: "Sample learner C", points: 30, attempted: 4, correct: 3 },
  { rank: 4, displayName: "Sample learner D", points: 10, attempted: 4, correct: 1 },
];

export const COMMUNITY_RULES = [
  "Explain the claim and say if you have a conflict, such as working for the business you are discussing.",
  "Do not promise returns or say an outcome cannot lose money.",
  "No spam, paid signals, or coordinated promotion.",
  "Critique the reasoning. Do not attack the person.",
];
