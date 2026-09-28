import type { TopicId } from "@/lib/curriculum/types";
import type { InvestingGoal } from "@/lib/filings/types";

export const GOAL_TOPICS: Record<InvestingGoal, TopicId[]> = {
  stability: ["cash", "diversification", "valuation"],
  growth: ["expectations", "thesis", "valuation"],
  income: ["cash", "valuation", "dilution"],
};

export type LearnInput = {
  id: string;
  kind: "lesson" | "note";
  title: string;
  hook: string;
  topicId: string;
  topicName: string;
  minutes: number;
  href: string;
  done: boolean;
};

export type LearnSlide = LearnInput & {
  why: string;
  action: string;
};

export function rankLearnSlides(
  items: LearnInput[],
  context: {
    goal: InvestingGoal | null;
    interestTopicIds: string[];
    mistakeTopicIds: string[];
  },
): LearnSlide[] {
  const goalTopics = context.goal ? GOAL_TOPICS[context.goal] : [];
  return items
    .map((item) => {
      let score = item.kind === "lesson" ? 8 : 3;
      let why = "Next short idea. Scroll when you want the one after it.";
      if (item.done) score -= 80;
      const goalIndex = goalTopics.indexOf(item.topicId as TopicId);
      if (goalIndex >= 0 && context.goal) {
        score += 50 - goalIndex;
        why = goalWhy(context.goal, item.topicName);
      }
      if (context.interestTopicIds.includes(item.topicId)) {
        score += 20;
        if (!context.goal) why = `You marked ${item.topicName} as something you want to practice.`;
      }
      if (context.mistakeTopicIds.includes(item.topicId)) {
        score += 70;
        why = `A recent practice answer on ${item.topicName} did not match the lesson. This card is the next rep.`;
      }
      if (item.done) why = "You already finished this one. It stays lower in the scroll if you want another look.";
      return { item, score, why };
    })
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .map(({ item, why }) => ({
      ...item,
      why,
      action: item.kind === "lesson" ? "Practice this idea" : "Read the note",
    }));
}

function goalWhy(goal: InvestingGoal, topicName: string): string {
  if (goal === "stability") {
    return `You want a steadier pattern. ${topicName} is here because a calmer goal starts with cash, bills, and whether one bad day hits everything.`;
  }
  if (goal === "growth") {
    return `You are willing to look at bigger swings. ${topicName} is about what a price already expects, not about chasing a move.`;
  }
  return `You want cash paid out to matter. ${topicName} is about what is left after the bills, not about a hotter story.`;
}
