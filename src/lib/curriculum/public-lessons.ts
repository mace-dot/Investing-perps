import { CURRICULUM_VERSION, type PublicLesson } from "./types";

const version = CURRICULUM_VERSION;

export const LESSONS: PublicLesson[] = [
  {
    id: "valuation-whole-business",
    topicId: "valuation",
    title: "One share is not the whole business",
    streetTitle: "A cheap-looking share can be an expensive business",
    estimatedMinutes: 4,
    curriculumVersion: version,
    reviewStatus: "needs_review",
    framework: "Benjamin Graham and Warren Buffett: price is what you pay, value is what you get. The whole-business price is share price times share count.",
    principle:
      "An $8 share is not automatically cheaper than an $80 share. First ask what the entire business would cost, then compare that cost with the profit the business actually earns in a year.",
    workedExample:
      "Imagine two lemonade stands with the same yearly profit. One sells tiny slices for $1. The other sells much bigger slices for $10. You cannot tell which stand is cheaper until you know how many slices make the whole stand.",
    whenUseful: "When someone says a stock is cheap or expensive only because the number on one share looks small or large.",
    whenItFails:
      "A lower price compared with this year's profit does not, by itself, make a better investment. The profit can shrink, and the business can still be risky.",
    ruleOfThumb: "Price the whole business, then compare that price with a year of profit.",
    exception: "A lower multiple is a clue, not a verdict.",
    formalName: "Market capitalization and the price-to-earnings ratio (P/E).",
    jargon: [
      { term: "Share", plain: "One slice of ownership." },
      { term: "Market cap", plain: "Price of one share times the number of shares." },
      { term: "P/E", plain: "Price of the whole business divided by one year of profit." },
    ],
    sources: [
      { title: "The Intelligent Investor, Benjamin Graham", note: "Further reading. Not a fact-check of this lesson." },
      { title: "Berkshire Hathaway shareholder letters, Warren Buffett", note: "Further reading on price versus value." },
    ],
    misconceptionTags: ["share_price_is_the_business_price", "lower_multiple_means_better_investment"],
    initial: {
      id: "q-price-whole",
      role: "initial",
      scenario:
        "Company A costs $8 per share, has 1 billion shares, and earned $40 million of net income last year. Company B costs $80 per share, has 10 million shares, and also earned $40 million of net income last year. Both figures are for the same year. Net income here means profit after expenses.",
      prompt: "Which company has the lower price compared with its yearly profit?",
      choices: [
        { id: "a", text: "Company A, because $8 is less than $80." },
        { id: "b", text: "Company B." },
        { id: "c", text: "They are the same, because the yearly profit is the same." },
        { id: "d", text: "You cannot tell unless you know which company is more popular." },
      ],
      hint: "Multiply the price of one share by the number of shares before you compare either company with $40 million of profit. Do not stop at the sticker price.",
    },
    transfer: {
      id: "q-price-whole-transfer",
      role: "transfer",
      scenario:
        "Cafe North costs $4 a share and has 50 million shares. Cafe South costs $40 a share and has 2 million shares. Each cafe earned $2 million last year. Assume those are the only shares.",
      prompt: "Which cafe is cheaper relative to last year's profit?",
      choices: [
        { id: "a", text: "Cafe North, because $4 is a small share price." },
        { id: "b", text: "Cafe South." },
        { id: "c", text: "They are equally cheap." },
        { id: "d", text: "The one people mention more often." },
      ],
      hint: "Find the price of each whole cafe first. North is $4 times 50 million. South is $40 times 2 million.",
    },
  },
  {
    id: "valuation-same-business-price",
    topicId: "valuation",
    title: "Different stickers, same whole price",
    streetTitle: "Two prices can describe the same business",
    estimatedMinutes: 4,
    curriculumVersion: version,
    reviewStatus: "needs_review",
    framework: "The same whole-business price can be split into many cheap shares or fewer expensive ones. John Bogle's broader point also fits here: look through the wrapper to what you actually own.",
    principle:
      "A company can split itself into more shares and cut the sticker price without making the business cheaper. The whole price and the profit did not change.",
    workedExample:
      "A pizza is still the same pizza whether you cut it into 8 slices or 16. A smaller slice has a smaller price. You did not get a cheaper pizza.",
    whenUseful: "When a split, a reverse split, or a different share count makes a sticker price look newly cheap or newly expensive.",
    whenItFails: "If the company also issues shares for cash, or profit changes, the whole price and the profit are no longer the same story.",
    ruleOfThumb: "If the whole price and the yearly profit are unchanged, the deal is unchanged.",
    exception: "A split can change how easily small buyers can trade, but that is not the same as a cheaper business.",
    formalName: "Share split versus valuation.",
    jargon: [{ term: "Share split", plain: "Cutting the same ownership into more, smaller pieces." }],
    sources: [{ title: "Common stock split mechanics, investor.gov", note: "Further reading on splits. Author-style reference, not a fact-check." }],
    misconceptionTags: ["share_price_is_the_business_price"],
    initial: {
      id: "q-price-equal",
      role: "initial",
      scenario:
        "Company C costs $20 a share and has 50 million shares. Company D costs $100 a share and has 10 million shares. Each earned $10 million last year. No other claims are known.",
      prompt: "Which company has the lower price compared with yearly profit?",
      choices: [
        { id: "a", text: "Company C, because $20 is less than $100." },
        { id: "b", text: "Company D, because a higher share price means a stronger business." },
        { id: "c", text: "They are the same on this comparison." },
        { id: "d", text: "Whichever one has been mentioned more this week." },
      ],
      hint: "Compute each whole-business price. If those prices match and profit matches, the comparison matches.",
    },
    transfer: {
      id: "q-price-equal-transfer",
      role: "transfer",
      scenario:
        "Yesterday a company had 10 million shares at $50, so the whole business cost $500 million. Today it split 2-for-1. You now see 20 million shares at $25. Yearly profit is still $25 million. Nothing else changed.",
      prompt: "What happened to the price of the business compared with yearly profit?",
      choices: [
        { id: "a", text: "It became cheaper because the share price fell from $50 to $25." },
        { id: "b", text: "It became more expensive because there are more shares." },
        { id: "c", text: "It stayed the same, because the whole price and the profit stayed the same." },
        { id: "d", text: "It cannot be judged after a split." },
      ],
      hint: "A 2-for-1 split doubles the count and halves the sticker. Multiply again.",
    },
  },
  {
    id: "diversification-same-storm",
    topicId: "diversification",
    title: "Three tickets on the same storm",
    streetTitle: "More names are not automatically more safety",
    estimatedMinutes: 4,
    curriculumVersion: version,
    reviewStatus: "needs_review",
    framework: "Harry Markowitz: what matters is how the pieces move together. Ray Dalio makes the same everyday point: don't bet the farm on one kind of weather.",
    principle:
      "Owning three businesses that all depend on the same customers, the same fuel, or the same rule is closer to one bet than to three.",
    workedExample:
      "Three umbrellas do not help if the problem is a drought. You still only prepared for rain.",
    whenUseful: "When a list of holdings looks long but the businesses share one way to get hurt.",
    whenItFails: "Some shared exposure is fine. The mistake is counting the length of the list as if it were protection.",
    ruleOfThumb: "Ask what single event could hurt every holding at once.",
    exception: "Even a mixed basket can fall together in a panic. Mixing reduces one kind of risk. It does not remove risk.",
    formalName: "Diversification and correlation.",
    jargon: [
      { term: "Diversification", plain: "Spreading money so one bad event is less likely to hit everything." },
      { term: "Correlation", plain: "How often things rise and fall together." },
    ],
    sources: [
      { title: "Portfolio Selection, Harry Markowitz", note: "Further reading. This lesson is a plain-language sketch, not the paper." },
      { title: "Principles, Ray Dalio", note: "Further reading on not betting everything on one outcome." },
    ],
    misconceptionTags: ["more_holdings_means_diversified"],
    initial: {
      id: "q-diverse-airlines",
      role: "initial",
      scenario:
        "A student owns stock in three airlines. All three buy the same kind of fuel, serve the same vacation routes, and would lose customers if people stop flying. The student says, “I am diversified because I own three companies.”",
      prompt: "Is this basket protected against a shock that hits air travel?",
      choices: [
        { id: "a", text: "Yes. Three companies are always safer than one." },
        { id: "b", text: "No. The three companies can be hurt by the same travel shock." },
        { id: "c", text: "Yes, if each company has a different ticker symbol." },
        { id: "d", text: "Yes, because airlines are a famous industry." },
      ],
      hint: "Ignore the count for a moment. Name one event that would hit all three.",
    },
    transfer: {
      id: "q-diverse-airlines-transfer",
      role: "transfer",
      scenario:
        "A club owns ten small suppliers. All ten sell most of their goods to one phone company. The phone company just cut orders.",
      prompt: "What kind of protection did the list of ten actually give against that one customer?",
      choices: [
        { id: "a", text: "Strong protection, because ten is a lot of companies." },
        { id: "b", text: "Little protection against that customer, because the same buyer feeds all ten." },
        { id: "c", text: "Full protection, because suppliers are not the phone company." },
        { id: "d", text: "Protection equal to a government guarantee." },
      ],
      hint: "Follow the money back to the shared customer.",
    },
  },
  {
    id: "diversification-calm-then-crisis",
    topicId: "diversification",
    title: "Calm days can hide a shared crack",
    streetTitle: "They looked independent until the same door shut",
    estimatedMinutes: 4,
    curriculumVersion: version,
    reviewStatus: "needs_review",
    framework: "Correlation is not a permanent fact. Howard Marks and the crisis literature both warn that things which drifted apart in quiet times can fall together when credit or confidence disappears.",
    principle:
      "Two businesses can look unrelated in an ordinary year and still depend on the same borrowed money. When lenders pull back, both can drop even if their customers differ.",
    workedExample:
      "Two shops on different streets can both fail if the landlord's bank stops lending and both leases come due the same month.",
    whenUseful: "When a backtest of quiet years is used as proof that two holdings protect each other.",
    whenItFails: "A shared bad year does not mean the businesses were identical. It means the protection failed for that particular risk.",
    ruleOfThumb: "Ask how each holding gets its financing, not only what it sells.",
    exception: "Some pairs really do hold up for a named risk. The claim has to name the risk. “Uncorrelated” with no time period is incomplete.",
    formalName: "Correlation that changes in stress.",
    jargon: [{ term: "Credit", plain: "Borrowed money that has to be rolled over or repaid." }],
    sources: [{ title: "The Most Important Thing, Howard Marks", note: "Further reading on risk. Not a fact-check." }],
    misconceptionTags: ["calm_correlation_means_a_hedge"],
    initial: {
      id: "q-diverse-credit",
      role: "initial",
      scenario:
        "A warehouse owner and a software firm usually move differently. Both, however, must refinance a large loan this year. In a year when lending freezes, both prices fall hard. A classmate says they were a hedge because they were in different industries.",
      prompt: "Were they a hedge against a freeze in lending?",
      choices: [
        { id: "a", text: "Yes, because different industries always hedge each other." },
        { id: "b", text: "No. Both needed new loans, so that particular shock hit both." },
        { id: "c", text: "Yes, because one is software." },
        { id: "d", text: "Yes, if their prices differed on ordinary days." },
      ],
      hint: "The question is about the lending freeze, not about their products.",
    },
    transfer: {
      id: "q-diverse-credit-transfer",
      role: "transfer",
      scenario:
        "A farm and a trucking company both depend on diesel. In quiet years their monthly results do not match. Then fuel prices triple for six months and both lose money.",
      prompt: "What did the quiet years fail to show?",
      choices: [
        { id: "a", text: "That different products guarantee protection against a fuel spike." },
        { id: "b", text: "That a shared cost can matter more than the usual difference in their results." },
        { id: "c", text: "That fuel prices cannot affect owners." },
        { id: "d", text: "That the farm was secretly a trucking company." },
      ],
      hint: "Look for the input both of them have to buy.",
    },
  },
  {
    id: "cash-profit-is-not-cash",
    topicId: "cash",
    title: "Profit on paper is not cash in the drawer",
    streetTitle: "They earned it, but the customer has not paid",
    estimatedMinutes: 5,
    curriculumVersion: version,
    reviewStatus: "needs_review",
    framework: "Warren Buffett's owner-earnings idea, in beginner form: a business you could own should produce spendable cash, not only an accounting profit.",
    principle:
      "Net income counts a sale even when the customer still owes the money. If unpaid bills rise and nothing else changes, cash from the business can be lower than profit — even negative.",
    workedExample:
      "You paint a house and write down $500 of profit, but the owner says they will pay next year. Your notebook shows profit. Your wallet does not.",
    whenUseful: "When a company celebrates profit while customers are paying more slowly.",
    whenItFails: "A rise in unpaid bills can be ordinary growth. The lesson is to notice it, not to treat every increase as a trick.",
    ruleOfThumb: "Ask whether the profit showed up as cash.",
    exception: "Depreciation lowers profit without a cash payment this year. Cash and profit differ in more than one direction.",
    formalName: "Net income versus cash from operations.",
    jargon: [
      { term: "Net income", plain: "Profit after the costs counted for the year." },
      { term: "Receivable", plain: "Money a customer still owes." },
      { term: "Cash from operations", plain: "Cash the core business brought in or used up." },
    ],
    sources: [{ title: "Berkshire Hathaway 1986 letter, Warren Buffett", note: "Further reading on owner earnings. This exercise uses a simpler cash identity." }],
    misconceptionTags: ["profit_is_cash"],
    initial: {
      id: "q-cash-receivables",
      role: "initial",
      scenario:
        "A fictional studio reports $5 million of net income. Customer unpaid bills rose by $6 million. Depreciation is $0. No other working-capital changes. No equipment was bought. Use this identity: cash from operations = net income − increase in unpaid bills + depreciation.",
      prompt: "What was cash from operations?",
      choices: [
        { id: "a", text: "$5 million, because profit is cash." },
        { id: "b", text: "$11 million." },
        { id: "c", text: "Negative $1 million." },
        { id: "d", text: "Zero, because depreciation is zero." },
      ],
      hint: "Start at $5 million of profit and subtract the $6 million that customers have not paid.",
    },
    transfer: {
      id: "q-cash-receivables-transfer",
      role: "transfer",
      scenario:
        "A bakery reports $3 million of net income. Unpaid bills rose by $1 million. Depreciation is $0.5 million, which was subtracted to get net income but was not a cash payment this year. No other changes. Cash from operations = net income − increase in unpaid bills + depreciation.",
      prompt: "What was cash from operations?",
      choices: [
        { id: "a", text: "$3 million." },
        { id: "b", text: "$2.5 million." },
        { id: "c", text: "$1.5 million." },
        { id: "d", text: "$4.5 million." },
      ],
      hint: "3 − 1 + 0.5. Depreciation is added back because it was not cash leaving this year.",
    },
  },
  {
    id: "cash-revenue-and-machines",
    topicId: "cash",
    title: "Busy cash register, empty pocket after the machines",
    streetTitle: "Sales can rise while spendable cash falls",
    estimatedMinutes: 4,
    curriculumVersion: version,
    reviewStatus: "needs_review",
    framework: "Revenue, profit, and free cash flow answer three different questions: how much was sold, what was left after costs, and what cash remained after the machines and buildings.",
    principle:
      "A company can sell more and even report more profit while spending so much on equipment that the cash left over shrinks.",
    workedExample:
      "A food truck has its best sales week, then spends the whole week's cash on a second truck. Sales were real. The owner's pocket is empty.",
    whenUseful: "When growth is described as if it were money the owner can take home.",
    whenItFails: "Spending on useful equipment can be wise. Low free cash flow is not automatically a bad business. It is a fact about cash this period.",
    ruleOfThumb: "Separate what was sold, what was earned, and what cash was left after equipment.",
    exception: "One hungry year of building can be followed by years with more cash. The period has to be named.",
    formalName: "Revenue, profit, and free cash flow.",
    jargon: [
      { term: "Revenue", plain: "What customers bought, before most costs." },
      { term: "Free cash flow", plain: "Cash from the business minus cash spent on long-lived equipment." },
    ],
    sources: [{ title: "Financial statement guide, investor.gov", note: "Further reading. Not a fact-check of the fictional numbers." }],
    misconceptionTags: ["revenue_is_profit", "profit_is_cash"],
    initial: {
      id: "q-cash-fcf",
      role: "initial",
      scenario:
        "A delivery company had $20 million of revenue, $4 million of net income, and $6 million of cash from operations. It spent $7 million cash on vans. Free cash flow = cash from operations − cash spent on vans. No other items.",
      prompt: "What was free cash flow?",
      choices: [
        { id: "a", text: "$20 million, the revenue." },
        { id: "b", text: "$4 million, the profit." },
        { id: "c", text: "Negative $1 million." },
        { id: "d", text: "$13 million." },
      ],
      hint: "Use cash from operations, not revenue or profit. Then subtract the vans.",
    },
    transfer: {
      id: "q-cash-fcf-transfer",
      role: "transfer",
      scenario:
        "Next year the same company has $8 million of cash from operations and spends $3 million on vans. Revenue is $30 million. Profit is $5 million.",
      prompt: "Which calculation is free cash flow that year?",
      choices: [
        { id: "a", text: "Revenue of $30 million." },
        { id: "b", text: "Profit of $5 million, because profit is the cash left over." },
        { id: "c", text: "$8 million plus $3 million." },
        { id: "d", text: "$8 million of cash from operations minus $3 million spent on vans." },
      ],
      hint: "Free cash flow was defined as cash from operations minus the van spending.",
    },
  },
  {
    id: "expectations-already-in-the-price",
    topicId: "expectations",
    title: "A good shop can still be a crowded price",
    streetTitle: "The price may already include the good news",
    estimatedMinutes: 4,
    curriculumVersion: version,
    reviewStatus: "needs_review",
    framework: "Buffett's “wonderful company at a fair price,” Howard Marks on second-level thinking, and Robert Shiller on stories: a popular business is not the same as a roomy price.",
    principle:
      "If buyers already expect excellent results, a pretty good report can leave the price almost unchanged. The small move is about the surprise, not a grade for the whole business.",
    workedExample:
      "Everyone at school already knows the pizza is excellent and pays extra for it. When the pizza is excellent again tonight, the price does not jump. The goodness was old news.",
    whenUseful: "When a classmate treats a flat price after decent news as proof the business is bad, or a jumping price as proof the business is good.",
    whenItFails: "You usually cannot see the exact expectation inside a price. The lesson is to separate business quality from how surprising the news was.",
    ruleOfThumb: "Ask what the price already assumed before you treat the latest move as a verdict.",
    exception: "Sometimes the news really does change the business. A small move is a clue about expectations, not a full appraisal.",
    formalName: "Expectations embedded in price.",
    jargon: [{ term: "Priced in", plain: "Already reflected in what buyers are paying." }],
    sources: [
      { title: "Irrational Exuberance, Robert Shiller", note: "Further reading. This lesson does not estimate a live market." },
      { title: "The Most Important Thing, Howard Marks", note: "Further reading on second-level thinking." },
    ],
    misconceptionTags: ["price_move_measures_quality", "good_business_means_good_price"],
    initial: {
      id: "q-expect-beat",
      role: "initial",
      scenario:
        "A well-known software firm reports profit slightly above what analysts had published. The share price rises 2% that day and then sits. A friend says the business must be weak because the stock “barely moved.” The only facts you have are the small beat and the 2% move.",
      prompt: "Which reading fits those facts?",
      choices: [
        { id: "a", text: "The business is weak because a strong business would always jump more than 2%." },
        { id: "b", text: "The 2% move is about how surprising the news was. It is not a full grade of the business." },
        { id: "c", text: "The business is a bad investment because the move was small." },
        { id: "d", text: "The business is a sure investment because the price rose." },
      ],
      hint: "Separate two questions: was the news a surprise, and is the business good?",
    },
    transfer: {
      id: "q-expect-beat-transfer",
      role: "transfer",
      scenario:
        "A factory everyone called “boring” reports a new five-year contract that buyers were not discussing. The share price rises 18% in a day. A friend says the 18% proves the factory is a better business than a famous brand that did not move.",
      prompt: "What can the 18% move support on its own?",
      choices: [
        { id: "a", text: "That the news was more surprising relative to the old price." },
        { id: "b", text: "That the factory is certainly a better long-term business than the famous brand." },
        { id: "c", text: "That the factory cannot fall later." },
        { id: "d", text: "That popularity before the news was proof of quality." },
      ],
      hint: "A one-day move measures the surprise against the prior price, not the whole future.",
    },
  },
  {
    id: "expectations-two-prices",
    topicId: "expectations",
    title: "The same profit, a richer story",
    streetTitle: "Paying more means expecting more",
    estimatedMinutes: 4,
    curriculumVersion: version,
    reviewStatus: "needs_review",
    framework: "Eugene Fama's caution — a price sums up a lot of information — and the value tradition's reply: you still have to notice how much hope that price contains.",
    principle:
      "If two prices are attached to the same current profit, the higher whole-business price is the one that requires a brighter future to work out. That does not say which future will happen.",
    workedExample:
      "Two identical bikes are for sale. One costs twice as much. The expensive tag only makes sense if you believe something extra that the cheap tag does not require — a warranty, a story, a future.",
    whenUseful: "When comparing how much optimism is already in two prices for the same current earnings.",
    whenItFails: "The higher price might be right if the future really is brighter. The lesson does not pick the winner. It names what the price is asking you to believe.",
    ruleOfThumb: "A higher price for the same current profit is a bigger bet on the future.",
    exception: "Profit this year can be temporarily depressed or inflated. “Same profit” has to be a fair comparison.",
    formalName: "Valuation multiple as an expectation.",
    jargon: [{ term: "Multiple", plain: "How many years of current profit the price equals." }],
    sources: [{ title: "Nobel lectures of Eugene Fama and Robert Shiller, 2013", note: "Further reading on information in prices and on swings in prices. Both are sketches here." }],
    misconceptionTags: ["good_business_means_good_price", "lower_multiple_means_better_investment"],
    initial: {
      id: "q-expect-two-prices",
      role: "initial",
      scenario:
        "On date one, a fictional company earns $5 a share and the whole business is priced at 10 times that year's earnings. On date two, it again earns $5 a share, and the whole business is priced at 20 times that year's earnings. Share count is unchanged. No other facts.",
      prompt: "Which price embeds higher expectations for the future, if this year's earnings are the same?",
      choices: [
        { id: "a", text: "The price at 10 times earnings." },
        { id: "b", text: "The price at 20 times earnings." },
        { id: "c", text: "They embed the same expectations because earnings are the same." },
        { id: "d", text: "Expectations cannot differ unless the company name is famous." },
      ],
      hint: "Same earnings, higher multiple, means buyers are paying more for the same current profit.",
    },
    transfer: {
      id: "q-expect-two-prices-transfer",
      role: "transfer",
      scenario:
        "Shop A and Shop B each earned $1 million this year. Buyers pay $8 million for all of Shop A and $30 million for all of Shop B. You know nothing else about growth.",
      prompt: "Which price requires the more optimistic story if you only know this year's profit?",
      choices: [
        { id: "a", text: "Shop A at $8 million." },
        { id: "b", text: "Shop B at $30 million." },
        { id: "c", text: "Neither. Same profit means the same story." },
        { id: "d", text: "The shop with the lower street number." },
      ],
      hint: "Divide the whole price by this year's profit and compare the two results.",
    },
  },
  {
    id: "dilution-same-shares-smaller-slice",
    topicId: "dilution",
    title: "You kept every share and still own less",
    streetTitle: "New slices shrink your piece of the pie",
    estimatedMinutes: 4,
    curriculumVersion: version,
    reviewStatus: "needs_review",
    framework: "Ownership is a fraction. Charlie Munger's habit of inversion helps: ask what got larger in the denominator, not only what you still hold.",
    principle:
      "If the company creates new shares for someone else, your percentage falls even when the number of shares in your drawer stays the same.",
    workedExample:
      "You own the only slice of a pie. The baker cuts the pie into two and gives the new slice to an investor. You still have your original slice. You now own half.",
    whenUseful: "When a founder says “I did not sell any shares” after a new round of financing.",
    whenItFails: "The new cash might make the whole pie more valuable. A smaller percentage of a much larger pie can be worth more dollars. The percentage still fell.",
    ruleOfThumb: "Percentage owned = your shares ÷ all shares after the new ones exist.",
    exception: "Keeping the same percentage is different from keeping the same dollar value.",
    formalName: "Dilution of ownership.",
    jargon: [{ term: "Dilution", plain: "Your fraction shrinks because new shares were created." }],
    sources: [{ title: "SEC, what stock is", note: "Further reading. The pie example is fictional." }],
    misconceptionTags: ["same_share_count_means_same_ownership"],
    initial: {
      id: "q-dilution-percent",
      role: "initial",
      scenario:
        "A founder owns 1,000,000 shares. Those are the only shares, so the founder owns 100%. The company then creates 1,000,000 new shares and gives them to an investor. The founder sells nothing and still holds 1,000,000 shares.",
      prompt: "What fraction does the founder own after the new shares exist?",
      choices: [
        { id: "a", text: "100%, because the founder kept every original share." },
        { id: "b", text: "50%." },
        { id: "c", text: "0%, because new investors always wipe out founders." },
        { id: "d", text: "200%, because there are twice as many shares." },
      ],
      hint: "The founder still has 1,000,000 shares. The company now has 2,000,000.",
    },
    transfer: {
      id: "q-dilution-percent-transfer",
      role: "transfer",
      scenario:
        "You own 200 of 1,000 shares in a campus print shop, which is 20%. The shop creates 1,000 new shares for a new partner. You sell none.",
      prompt: "What percentage do you own afterward?",
      choices: [
        { id: "a", text: "20%, because you kept 200 shares." },
        { id: "b", text: "10%." },
        { id: "c", text: "50%." },
        { id: "d", text: "200%." },
      ],
      hint: "You still have 200 shares. Total shares are 1,000 + 1,000.",
    },
  },
  {
    id: "dilution-profit-per-slice",
    topicId: "dilution",
    title: "The same profit, thinner per share",
    streetTitle: "More shares mean less profit on each one",
    estimatedMinutes: 4,
    curriculumVersion: version,
    reviewStatus: "needs_review",
    framework: "Per-share results change when the share count changes. This is the beginner version of watching dilution in earnings, not a full financing model.",
    principle:
      "If profit stays flat and the share count doubles, profit per share is cut in half. That is arithmetic. It does not say whether the cash raised will earn more later.",
    workedExample:
      "Four friends split $40 of tips. Then four more friends join and the tips are still $40. Each person gets less, even though the night's tips did not fall.",
    whenUseful: "When a headline quotes profit per share before and after a share issue and you need the mechanic.",
    whenItFails: "If the new cash earns profit, next year's total profit may rise. This lesson freezes profit on purpose so the share-count effect is visible.",
    ruleOfThumb: "Profit per share = profit for the period ÷ shares that share in it.",
    exception: "A lower profit per share today can coexist with a sensible use of the new cash. Say which year you mean.",
    formalName: "Earnings per share after issuance.",
    jargon: [{ term: "Earnings per share", plain: "Profit divided by the number of shares." }],
    sources: [{ title: "SEC beginner’s guide to financial statements", note: "Further reading. Numbers here are fictional and the profit is assumed flat." }],
    misconceptionTags: ["same_share_count_means_same_ownership"],
    initial: {
      id: "q-dilution-eps",
      role: "initial",
      scenario:
        "A company earns $10 million this year. Before a stock issue it has 10 million shares. It issues 10 million new shares for cash. The assumption, stated on purpose: the new cash does not change this year's earnings. Earnings stay $10 million.",
      prompt: "What is profit per share after the issue, under that assumption?",
      choices: [
        { id: "a", text: "$1.00, the same as before." },
        { id: "b", text: "$0.50." },
        { id: "c", text: "$2.00." },
        { id: "d", text: "$10 million." },
      ],
      hint: "After the issue there are 20 million shares and still $10 million of profit.",
    },
    transfer: {
      id: "q-dilution-eps-transfer",
      role: "transfer",
      scenario:
        "A campus newspaper earns $12,000 this year and has 4,000 shares. It creates 2,000 new shares. Assume the cash does not change this year's $12,000 earnings.",
      prompt: "What is earnings per share after the new shares?",
      choices: [
        { id: "a", text: "$3.00." },
        { id: "b", text: "$2.00." },
        { id: "c", text: "$12,000." },
        { id: "d", text: "$6.00." },
      ],
      hint: "Divide $12,000 by 6,000 shares.",
    },
  },
  {
    id: "thesis-what-would-change-your-mind",
    topicId: "thesis",
    title: "A belief needs an exit door",
    streetTitle: "Say what would make you wrong",
    estimatedMinutes: 4,
    curriculumVersion: version,
    reviewStatus: "needs_review",
    framework: "Charlie Munger: invert. Peter Thiel's useful classroom question, stripped of hype: what do you believe that is specific enough to be tested? A thesis is not a cheer.",
    principle:
      "“People love coffee, so the chain will double” is a hope. A thesis names the claim, the evidence, and the fact that would make you abandon it.",
    workedExample:
      "“This bus route is faster” becomes testable when you add, “I would drop that if the ride takes longer than the old route for two weeks in a row.”",
    whenUseful: "When you are about to publish a view about a business.",
    whenItFails: "A disconfirming fact you would never actually accept is not an exit door. It has to be observable.",
    ruleOfThumb: "If nothing could change your mind, you do not have a thesis yet. You have a slogan.",
    exception: "Some claims are about values, not evidence. Label those as preferences, not as business theses.",
    formalName: "Disconfirming evidence.",
    jargon: [{ term: "Thesis", plain: "A claim you can explain and that new facts could overturn." }],
    sources: [
      { title: "Poor Charlie’s Almanack, Charlie Munger", note: "Further reading on inversion." },
      { title: "Zero to One, Peter Thiel", note: "Further reading on a specific, testable claim. Not a recommendation to copy any deal." },
    ],
    misconceptionTags: ["thesis_without_disconfirmation", "fame_or_popularity_is_evidence"],
    initial: {
      id: "q-thesis-mind",
      role: "initial",
      scenario:
        "A student writes: “Campus Cups will double because students love coffee.” There is no date, no measure of sales, and no fact that would make the student abandon the claim.",
      prompt: "What is missing before this is a thesis you can learn from?",
      choices: [
        { id: "a", text: "A famous investor who likes coffee." },
        { id: "b", text: "A stated fact that would change the author's mind, such as same-store sales falling for two years." },
        { id: "c", text: "A higher share price." },
        { id: "d", text: "More exclamation points so the claim sounds confident." },
      ],
      hint: "Look for the observation that would prove the claim wrong.",
    },
    transfer: {
      id: "q-thesis-mind-transfer",
      role: "transfer",
      scenario:
        "Someone says: “This phone case brand will win because the logo is popular on my floor.” They add: “I would change my mind if the brand’s repeat-purchase rate stayed under 10% for a full year.”",
      prompt: "What did the second sentence add?",
      choices: [
        { id: "a", text: "Proof that the brand will win." },
        { id: "b", text: "A way the claim could be dropped if a named fact shows up." },
        { id: "c", text: "A guarantee of profit." },
        { id: "d", text: "Evidence that popularity on one floor is enough." },
      ],
      hint: "The second sentence does not make the claim true. It makes it testable.",
    },
  },
  {
    id: "thesis-challenge-the-assumption",
    topicId: "thesis",
    title: "Argue with the assumption, not the person",
    streetTitle: "A useful challenge names the hidden bet",
    estimatedMinutes: 4,
    curriculumVersion: version,
    reviewStatus: "needs_review",
    framework: "Munger on incentives and assumptions, plus Kahneman's warning on confidence: sounding sure is not evidence. A good comment attacks a premise.",
    principle:
      "“You are clueless” does not test a thesis. “This only works if store growth stays at 20% without new capital” does. Popularity and a famous name are not evidence either.",
    workedExample:
      "A friend says the group project will finish Friday if everyone has free evenings. The useful reply is, “That assumes nobody has a shift on Thursday,” not “you always mess this up.”",
    whenUseful: "When you comment on someone else's write-up, or when you reread your own.",
    whenItFails: "Naming an assumption does not prove the thesis wrong. It shows where the thesis could break.",
    ruleOfThumb: "A strong challenge points at a belief the thesis needs, and at a fact that would pressure it.",
    exception: "Tone still matters. A precise challenge can be wrong. Precision is not the same as truth.",
    formalName: "Assumption and counterargument.",
    jargon: [{ term: "Assumption", plain: "A belief the claim needs even if nobody wrote it down." }],
    sources: [
      { title: "Thinking, Fast and Slow, Daniel Kahneman", note: "Further reading. A correct guess is not the same as understanding." },
      { title: "Poor Charlie’s Almanack, Charlie Munger", note: "Further reading on incentives and inversion." },
    ],
    misconceptionTags: ["fame_or_popularity_is_evidence", "thesis_without_disconfirmation"],
    initial: {
      id: "q-thesis-challenge",
      role: "initial",
      scenario:
        "A post says: “North Quad Rentals will grow profits 20% a year because the campus keeps adding students. It will not need new capital.” Four replies are offered.",
      prompt: "Which reply challenges an assumption instead of attacking a person or citing fame?",
      choices: [
        { id: "a", text: "“You are bad at this.”" },
        { id: "b", text: "“A famous fund owns a different housing stock, so this must be right.”" },
        { id: "c", text: "“This assumes enrollment keeps rising and that growth does not require new cash. What happens if enrollment is flat?”" },
        { id: "d", text: "“Everyone in the group chat agrees, so the claim is correct.”" },
      ],
      hint: "Find the reply that names a belief the claim needs and a fact that would pressure it.",
    },
    transfer: {
      id: "q-thesis-challenge-transfer",
      role: "transfer",
      scenario:
        "A thesis says a tutoring app will stay profitable because volunteer tutors will keep working for free. One comment says, “This assumes volunteers do not start asking to be paid when hours double.”",
      prompt: "What kind of comment is that?",
      choices: [
        { id: "a", text: "A personal attack." },
        { id: "b", text: "Proof the app will fail." },
        { id: "c", text: "A challenge to a specific assumption, not yet proof either way." },
        { id: "d", text: "Evidence from popularity." },
      ],
      hint: "The comment names a belief. It does not settle the outcome by itself.",
    },
  },
];

export function lessonById(id: string): PublicLesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}

export function questionById(id: string): { lesson: PublicLesson; question: PublicLesson["initial"] } | undefined {
  for (const lesson of LESSONS) {
    if (lesson.initial.id === id) return { lesson, question: lesson.initial };
    if (lesson.transfer.id === id) return { lesson, question: lesson.transfer };
  }
  return undefined;
}

export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}
