export const TECHNIQUE_FIELDS = [
  ["principle", "What is the technique?"],
  ["example", "Show an example"],
  ["whenUseful", "When would someone use it?"],
  ["whenItFails", "When might it mislead?"],
] as const;

export const THESIS_FIELDS = [
  ["claim", "What do you believe?"],
  ["evidence", "What evidence supports it?"],
  ["assumptions", "What assumptions must hold?"],
  ["counterargument", "What is the strongest counterargument?"],
  ["changeMind", "What would change your mind?"],
] as const;

export type ComposeKind = "technique" | "thesis";

export type ComposedDocument = {
  title: string;
  hook: string;
  essay: string;
  fields: Record<string, string>;
};

const TRADE = /\b(buy|sell|hold)\b/i;
const MONEY = /\$\d[\d,]*(?:\.\d+)?(?:\s?(?:trillion|billion|million|thousand))?/gi;

export function fieldPrompts(kind: ComposeKind): readonly (readonly [string, string])[] {
  return kind === "technique" ? TECHNIQUE_FIELDS : THESIS_FIELDS;
}

export function moneyPhrases(text: string): string[] {
  return text.match(MONEY) ?? [];
}

function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 8 && !TRADE.test(sentence));
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function canonicalDocument(
  kind: ComposeKind,
  notes: string,
  title: string,
): { ok: true; document: ComposedDocument } | { ok: false; error: string } {
  const lines = sentences(notes);
  if (notes.trim().length < 40 || lines.length < 2) {
    return {
      ok: false,
      error: "Add at least two sentences. The writer only rearranges your notes, and it skips any line that says buy, sell, or hold.",
    };
  }
  const fields: Record<string, string> = {};
  fieldPrompts(kind).forEach(([key], index) => {
    fields[key] = lines[index] ?? "";
  });
  const essay = chunk(lines, 2).map((group) => group.join(" ")).join("\n\n");
  const hook = lines[0]?.slice(0, 180) ?? "";
  const resolvedTitle = title.trim().length >= 3 ? title.trim().slice(0, 140) : (lines[0]?.slice(0, 80) ?? "Untitled note");
  return { ok: true, document: { title: resolvedTitle, hook, essay, fields } };
}

export function documentFitsNotes(notes: string, doc: ComposedDocument): boolean {
  const blob = [doc.title, doc.hook, doc.essay, ...Object.values(doc.fields)].join("\n");
  if (TRADE.test(blob)) return false;
  if (doc.essay.trim().length < 40 || doc.title.trim().length < 3 || doc.title.length > 140) return false;
  if (doc.hook.trim().length < 8) return false;
  const allowed = new Set(moneyPhrases(notes).map((phrase) => phrase.toLowerCase()));
  const used = blob.match(MONEY) ?? [];
  if (used.some((phrase) => !allowed.has(phrase.toLowerCase()))) return false;
  const noteWords = wordCount(notes);
  if (wordCount(blob) > Math.max(120, noteWords * 3)) return false;
  return true;
}

export function plainDocument(input: {
  title: string;
  topic: string;
  essay: string;
  prompts: readonly (readonly [string, string])[];
  fields: Record<string, string>;
}): string {
  const reading = input.essay.trim() || "The notes are still in the boxes below.";
  const boxes = input.prompts
    .map(([key, label]) => `${label}\n${(input.fields[key] ?? "").trim() || "(still empty)"}`)
    .join("\n\n");
  return [
    input.title.trim() || "Untitled",
    input.topic,
    "",
    reading,
    "",
    boxes,
    "",
    "A reading of the author's notes. It does not tell you what to do with your money.",
  ].join("\n");
}

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) groups.push(items.slice(index, index + size));
  return groups;
}
