import type { FilingExcerpt } from "@/lib/filings/types";

const TOPICS: { heading: string; pattern: RegExp }[] = [
  { heading: "Capital spending", pattern: /capital expend|property, plant and equipment|payments for acquisition of property/i },
  { heading: "Plans and platforms", pattern: /roll out|rollout|plans? to (?:build|launch|expand|roll)|high tech platforms/i },
  { heading: "Going concern", pattern: /going concern/i },
  { heading: "Debt", pattern: /long-term debt|covenant|credit facility/i },
  { heading: "Cash paid out", pattern: /\bdividends?\b/i },
  { heading: "Customers", pattern: /customer concentration|major customer/i },
];

export function htmlToPlain(source: string): string {
  const withoutCode = source
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const withBreaks = withoutCode
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/h\d>/gi, ".\n")
    .replace(/<\/p>|<\/div>|<\/tr>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  const decoded = withBreaks
    .replace(/&#(\d+);/g, (_, digits: string) => safeCodePoint(Number(digits)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'");
  return decoded.replace(/[ \t]+\n/g, "\n").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function safeCodePoint(value: number): string {
  if (!Number.isFinite(value) || value < 0 || value > 0x10ffff) return " ";
  try {
    return String.fromCodePoint(value);
  } catch {
    return " ";
  }
}

export function discussionSlice(plain: string): string {
  const matches = [...plain.matchAll(/item\s+7[\.\s]+management[\s\S]{0,120}?discussion/gi)];
  let start = -1;
  for (const match of matches) {
    const index = match.index ?? 0;
    const look = plain.slice(index, index + 320).toLowerCase();
    if (look.includes("item 7a") && look.includes("item 8")) continue;
    start = index;
  }
  if (start < 0) return plain.slice(0, 14_000);
  const rest = plain.slice(start);
  const endMatch = rest.slice(500).search(/item\s+7a[\.\s]|item\s+8[\.\s]+financial statements/i);
  const end = endMatch < 0 ? Math.min(rest.length, 16_000) : Math.min(endMatch + 500, 16_000);
  return rest.slice(0, end);
}

function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.])\s+(?=[A-Z])/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 40 && sentence.length <= 460);
}

export function excerptsFromPlain(plain: string): FilingExcerpt[] {
  const discussion = discussionSlice(plain);
  const pools = [sentences(discussion), sentences(plain)];
  const used = new Set<string>();
  const excerpts: FilingExcerpt[] = [];
  for (const topic of TOPICS) {
    const found = pools.flat().find((sentence) => topic.pattern.test(sentence) && !used.has(sentence));
    if (!found) continue;
    used.add(found);
    excerpts.push({ heading: topic.heading, text: found });
  }
  if (excerpts.length === 0 && discussion.trim().length > 80) {
    excerpts.push({
      heading: "Management's discussion",
      text: discussion.replace(/\s+/g, " ").trim().slice(0, 600),
    });
  }
  return excerpts.slice(0, 5);
}

export function joinedExcerptText(excerpts: FilingExcerpt[]): string {
  return excerpts.map((excerpt) => excerpt.text).join(" ");
}
