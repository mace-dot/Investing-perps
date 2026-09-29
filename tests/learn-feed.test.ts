import { describe, expect, it } from "vitest";
import { rankLearnSlides, type LearnInput } from "@/lib/learn-feed";

const cards: LearnInput[] = [
  {
    id: "cash",
    kind: "lesson",
    title: "Profit is not cash",
    hook: "A fine report can still leave the drawer empty.",
    topicId: "cash",
    topicName: "Cash",
    minutes: 4,
    href: "/practice/cash",
    done: false,
  },
  {
    id: "thesis",
    kind: "lesson",
    title: "Write the fact that would change your mind",
    hook: "A reason needs a way to fail.",
    topicId: "thesis",
    topicName: "A thesis",
    minutes: 4,
    href: "/practice/thesis",
    done: false,
  },
];

describe("learning scroll order", () => {
  it("puts a steadier goal's cash lesson ahead of a thesis", () => {
    const slides = rankLearnSlides(cards, { goal: "stability", interestTopicIds: [], mistakeTopicIds: [] });
    expect(slides[0]?.id).toBe("cash");
    expect(slides[0]?.why.toLowerCase()).toContain("steadier");
    expect(slides[0]?.why).not.toMatch(/\b(buy|sell)\b/i);
  });

  it("puts a missed topic first even when the goal points elsewhere", () => {
    const slides = rankLearnSlides(cards, { goal: "stability", interestTopicIds: [], mistakeTopicIds: ["thesis"] });
    expect(slides[0]?.id).toBe("thesis");
    expect(slides[0]?.why).toContain("did not match");
  });

  it("lets a money picture outrank the goal, while a miss still comes first", () => {
    const guided = rankLearnSlides(cards, {
      goal: "stability",
      interestTopicIds: [],
      mistakeTopicIds: [],
      strategyTopicIds: ["thesis", "valuation"],
    });
    expect(guided[0]?.id).toBe("thesis");
    expect(guided[0]?.why.toLowerCase()).toContain("money picture");
    expect(guided[0]?.why).not.toMatch(/\b(buy|sell|hold)\b/i);

    const missed = rankLearnSlides(cards, {
      goal: "stability",
      interestTopicIds: [],
      mistakeTopicIds: ["cash"],
      strategyTopicIds: ["thesis"],
    });
    expect(missed[0]?.id).toBe("cash");
    expect(missed[0]?.why).toContain("did not match");
  });

  it("sinks a finished lesson below one that is still open", () => {
    const slides = rankLearnSlides(
      cards.map((card) => (card.id === "cash" ? { ...card, done: true } : card)),
      { goal: "income", interestTopicIds: [], mistakeTopicIds: [] },
    );
    expect(slides[0]?.id).toBe("thesis");
    expect(slides[1]?.why).toContain("already finished");
  });
});
