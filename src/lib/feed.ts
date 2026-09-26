export type FeedFilter = "for_you" | "following" | "club";

export type FeedReason =
  | { kind: "interest"; topicName: string }
  | { kind: "mistake"; topicName: string }
  | { kind: "followed"; authorName: string }
  | { kind: "club" }
  | { kind: "recent" }
  | { kind: "new_to_you" };

export type FeedCandidate = {
  id: string;
  authorId: string;
  authorName: string;
  topicId: string;
  topicName: string;
  clubId: string | null;
  createdAt: number;
  viewed: boolean;
};

export type RankedFeedItem = FeedCandidate & {
  score: number;
  reason: FeedReason;
  why: string;
};

export function explainReason(reason: FeedReason): string {
  switch (reason.kind) {
    case "interest":
      return `You chose ${reason.topicName} as something you want to practice.`;
    case "mistake":
      return `A recent practice miss was about ${reason.topicName}.`;
    case "followed":
      return `You follow ${reason.authorName}.`;
    case "club":
      return "Someone in your club shared it.";
    case "recent":
      return "It is recent, and you have not read it yet.";
    case "new_to_you":
      return "You have not opened it yet. This feed is a simple mix of your topics, follows, and new posts — not an AI recommendation.";
  }
}

export function rankForYou(input: {
  posts: FeedCandidate[];
  interestTopicIds: string[];
  mistakeTopicIds: string[];
  followedAuthorIds: string[];
  now?: number;
}): RankedFeedItem[] {
  const now = input.now ?? Date.now();
  const day = 86_400_000;

  const ranked = input.posts
    .filter((post) => !post.viewed)
    .map((post) => {
      let score = 0;
      let reason: FeedReason = { kind: "new_to_you" };

      if (input.interestTopicIds.includes(post.topicId)) {
        score += 30;
        reason = { kind: "interest", topicName: post.topicName };
      }
      if (input.mistakeTopicIds.includes(post.topicId)) {
        score += 40;
        reason = { kind: "mistake", topicName: post.topicName };
      }
      if (input.followedAuthorIds.includes(post.authorId)) {
        score += 25;
        if (reason.kind === "new_to_you") {
          reason = { kind: "followed", authorName: post.authorName };
        }
      }

      const ageDays = Math.max(0, (now - post.createdAt) / day);
      const recency = Math.max(0, 14 - ageDays);
      score += recency;
      if (reason.kind === "new_to_you" && recency >= 10) {
        reason = { kind: "recent" };
      }

      return { ...post, score, reason, why: explainReason(reason) };
    })
    .sort((a, b) => b.score - a.score || b.createdAt - a.createdAt);

  return ranked;
}

export function filterFeed(
  posts: FeedCandidate[],
  filter: FeedFilter,
  context: {
    interestTopicIds: string[];
    mistakeTopicIds: string[];
    followedAuthorIds: string[];
    clubId: string | null;
    now?: number;
  },
): { items: RankedFeedItem[]; caughtUp: boolean } {
  if (filter === "following") {
    const items = posts
      .filter((post) => context.followedAuthorIds.includes(post.authorId) && !post.viewed)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((post) => {
        const reason: FeedReason = { kind: "followed", authorName: post.authorName };
        return { ...post, score: 1, reason, why: explainReason(reason) };
      });
    return { items, caughtUp: items.length === 0 };
  }

  if (filter === "club") {
    const items = posts
      .filter((post) => context.clubId !== null && post.clubId === context.clubId && !post.viewed)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((post) => {
        const reason: FeedReason = { kind: "club" };
        return { ...post, score: 1, reason, why: explainReason(reason) };
      });
    return { items, caughtUp: context.clubId !== null && items.length === 0 };
  }

  const items = rankForYou({ posts, ...context });
  return { items, caughtUp: items.length === 0 };
}
