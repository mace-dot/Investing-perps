export type Framework = {
  id: string;
  plainName: string;
  formalName: string;
  attributedTo: string;
  oneSentence: string;
  streetExplanation: string;
  whenItFails: string;
  topicIds: string[];
};

/**
 * Plain-language map of well-known ideas.
 * Fame is not evidence. These notes are teaching aids and are marked needs review.
 */
export const FRAMEWORKS: Framework[] = [
  {
    id: "whole-business-price",
    plainName: "Price the whole thing, not one slice",
    formalName: "Market capitalization versus share price",
    attributedTo: "Benjamin Graham and Warren Buffett, on not confusing price with value",
    oneSentence: "The number on one share is a slice. The business price is the slice times how many slices exist.",
    streetExplanation:
      "An $8 share can belong to a more expensive business than an $80 share. Multiply first. Then compare that total with a year of profit.",
    whenItFails: "A lower price compared with this year’s profit is not, by itself, a better investment.",
    topicIds: ["valuation", "expectations"],
  },
  {
    id: "margin-of-safety",
    plainName: "Leave room for being wrong",
    formalName: "Margin of safety",
    attributedTo: "Benjamin Graham, popularized for business owners by Warren Buffett",
    oneSentence: "If your estimate has to be perfect for the decision to work, you do not have room for a surprise.",
    streetExplanation:
      "You would not cross a bridge that only holds your weight on a perfect day. A cushion is not a prediction. It is room for a mistake in the numbers.",
    whenItFails: "A cushion you invent to feel calm is not the same as a cushion you can point to in the facts.",
    topicIds: ["valuation", "thesis"],
  },
  {
    id: "circle-of-competence",
    plainName: "Stay near what you can explain",
    formalName: "Circle of competence",
    attributedTo: "Warren Buffett and Charlie Munger",
    oneSentence: "If you cannot say how the business gets paid, in ordinary words, you are guessing.",
    streetExplanation:
      "Liking a product is not the same as understanding the business. Peter Lynch’s “buy what you know” fails in the same way when “know” only means “I use it.”",
    whenItFails: "Familiarity can make you overconfident. Knowing the product is the start of a question, not the answer.",
    topicIds: ["thesis"],
  },
  {
    id: "invert",
    plainName: "Ask how this fails",
    formalName: "Inversion",
    attributedTo: "Charlie Munger",
    oneSentence: "A useful belief names the fact that would make you drop it.",
    streetExplanation:
      "Instead of collecting reasons you are right, list the way the claim breaks. That list is the beginning of a thesis, not a mood.",
    whenItFails: "A failure story you would never accept as evidence is not really an exit door.",
    topicIds: ["thesis"],
  },
  {
    id: "shared-storm",
    plainName: "More names can still be one storm",
    formalName: "Diversification and correlation",
    attributedTo: "Harry Markowitz on baskets; Ray Dalio on not betting everything on one kind of weather",
    oneSentence: "Extra holdings help only when they do not all get hurt by the same event.",
    streetExplanation:
      "Three airlines can be one bet on flying. Quiet years can also hide a shared loan or a shared fuel bill.",
    whenItFails: "Spreading out is not a promise that a basket cannot fall. It only changes which shocks hurt everything at once.",
    topicIds: ["diversification"],
  },
  {
    id: "cash-versus-story",
    plainName: "Profit on paper is not cash you can spend",
    formalName: "Earnings versus cash flow",
    attributedTo: "Warren Buffett’s owner-earnings discussion, simplified",
    oneSentence: "A sale you have not collected, and equipment you must buy, can leave the drawer empty while the report looks fine.",
    streetExplanation:
      "Revenue is what was sold. Profit is what the report says was left. Cash is what arrived and what had to be spent to keep going.",
    whenItFails: "One year of heavy spending can be a build-out, not a trick. Name the year.",
    topicIds: ["cash"],
  },
  {
    id: "expectations",
    plainName: "The price may already include the good news",
    formalName: "Expectations in the price",
    attributedTo: "Howard Marks on second-level thinking; Robert Shiller on stories; the value tradition on a fair price",
    oneSentence: "A fine business can be a crowded price if buyers already expect excellent results.",
    streetExplanation:
      "A small move after decent news often says the news was expected. It is not a grade for the whole business. A higher price for the same current profit is a bigger bet on the future.",
    whenItFails: "You cannot see the exact expectation from one day of prices. Do not invent a target.",
    topicIds: ["expectations", "valuation"],
  },
  {
    id: "prices-hold-information",
    plainName: "A price already reflects a lot of public talk",
    formalName: "Efficient-market hypothesis, and its limit",
    attributedTo: "Eugene Fama and Robert Shiller shared the 2013 prize in economic sciences. The committee did not pick a winner between them. This is not the Nobel Peace Prize.",
    oneSentence: "Beating a price after costs is hard, and a price can still swing with a story. Both cautions can be true.",
    streetExplanation:
      "Do not treat a popular price as proof, and do not treat your hunch as proof you know more than everyone else. Use the business facts you can actually check.",
    whenItFails: "Neither idea tells you what to buy. They stop two opposite kinds of overconfidence.",
    topicIds: ["expectations", "thesis"],
  },
  {
    id: "dilution",
    plainName: "New slices shrink your piece",
    formalName: "Dilution",
    attributedTo: "Standard ownership arithmetic, used whenever investors read a financing",
    oneSentence: "Keeping every share you had does not keep your percentage if new shares are created.",
    streetExplanation:
      "Your shares divided by all shares is the fraction. Profit per share uses that new count too. The cash raised might still be useful. The fraction is a separate fact.",
    whenItFails: "A smaller slice of a much more valuable business can be worth more dollars. Say which question you are answering.",
    topicIds: ["dilution"],
  },
  {
    id: "costs-and-the-haystack",
    plainName: "Costs quietly eat the result",
    formalName: "Long-term ownership and fees",
    attributedTo: "John Bogle, and the stewardship theme in Larry Fink’s letters to company owners",
    oneSentence: "A small repeating fee, or a story that ignores costs, changes what is left for the owner.",
    streetExplanation:
      "This app does not place trades. The teaching point is narrower: when you compare stories, ask what is left after costs, and do not confuse a famous firm’s letter with a personal instruction.",
    whenItFails: "A low fee does not make a risky holding safe. Cost is one input.",
    topicIds: ["expectations", "cash"],
  },
  {
    id: "overconfidence",
    plainName: "Feeling sure is not the same as being right",
    formalName: "Overconfidence and loss aversion",
    attributedTo: "Daniel Kahneman (2002) and Richard Thaler (2017), prizes in economic sciences, not the Peace Prize",
    oneSentence: "A correct guess with a contradictory explanation is not understanding, and confidence is not a point system.",
    streetExplanation:
      "Write the reason in words. If the reason fights the choice, believe the conflict. It is information about your understanding, not a score for bravery.",
    whenItFails: "Being unsure is not a virtue by itself. The words still have to match the facts.",
    topicIds: ["thesis"],
  },
  {
    id: "lemons",
    plainName: "The seller may know something you do not",
    formalName: "Asymmetric information",
    attributedTo: "George Akerlof, 2001 prize in economic sciences, the market for lemons. Not the Peace Prize.",
    oneSentence: "When quality is hard to see, a shiny price or a shiny story is not proof.",
    streetExplanation:
      "A used bike looks the same on the curb whether it shifts cleanly or slips. Ask what the seller can see that you cannot, and what evidence would close that gap.",
    whenItFails: "Not every unknown is a trap. The point is to notice the gap, not to refuse every unfamiliar business.",
    topicIds: ["thesis", "valuation"],
  },
  {
    id: "access-is-not-a-good-deal",
    plainName: "Being allowed to borrow is not the same as a good deal",
    formalName: "Microcredit, with mixed later evidence",
    attributedTo: "Muhammad Yunus and Grameen Bank, 2006 Nobel Peace Prize, for microcredit. That prize is not the prize in economic sciences, and it is not a stock-picking award.",
    oneSentence: "Access to money can help a person start, and the terms can still be a bad bargain.",
    streetExplanation:
      "A loan is a tool with a cost and a repayment. Later studies of small loans often found modest effects, not a transformation. High repayment is not proof the borrower was better off.",
    whenItFails: "Do not treat the Peace Prize, or any later headline, as proof that a particular loan helps. This idea is not a share-price drill.",
    topicIds: ["cash", "thesis"],
  },
];

/**
 * Famous frameworks do not all agree. The app does not pick a side.
 * A name or a prize is a reading pointer, not evidence.
 */
export const IDEA_TENSIONS: string[] = [
  "Spreading and concentrating disagree. Some writers stress mixing holdings that fail on different days. Others spend years on a few businesses they can explain. Neither habit is a buy instruction.",
  "Eugene Fama and Robert Shiller shared one 2013 prize in economic sciences. One stressed how much information a price already holds. The other stressed stories that can still swing prices. The committee did not crown a winner.",
  "A cushion under a cautious worth guess is not the same claim as “the market price is already the best estimate.” Both can be teaching notes. Neither is a recommendation.",
  "Being allowed to borrow, including the microcredit idea behind a Peace Prize, is not the same as a good deal. Terms, cost, and later evidence still have to be read.",
];

export function frameworksForTopic(topicId: string): Framework[] {
  return FRAMEWORKS.filter((item) => item.topicIds.includes(topicId));
}
