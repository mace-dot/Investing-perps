import { describe, expect, it } from "vitest";
import { canonicalDocument, documentFitsNotes, plainDocument } from "@/lib/compose-doc";

const notes = "A cheap sticker can hide a huge business. Count every share before you compare two prices. The comparison fails when the share counts are made up.";

describe("notes become a reading", () => {
  it("rearranges the notes and does not add a dollar amount", () => {
    const result = canonicalDocument("technique", notes, "Count the shares");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.document.fields.principle).toContain("cheap sticker");
    expect(result.document.essay).toContain("Count every share");
    expect(result.document.essay).not.toMatch(/\$/);
    expect(documentFitsNotes(notes, result.document)).toBe(true);
  });

  it("drops a line that tells someone to buy", () => {
    const result = canonicalDocument("thesis", `${notes} You should buy the cheaper sticker.`, "Count the shares");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.document.essay.toLowerCase()).not.toMatch(/\bbuy\b/);
  });

  it("rejects a polished draft that invents a dollar amount", () => {
    const result = canonicalDocument("technique", notes, "Count the shares");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(documentFitsNotes(notes, { ...result.document, essay: `${result.document.essay} Sales were $9 billion.` })).toBe(false);
  });

  it("writes a text document from the same notes", () => {
    const text = plainDocument({
      title: "Count the shares",
      topic: "The whole business",
      essay: "A cheap sticker can hide a huge business.",
      prompts: [["principle", "What is the technique?"]],
      fields: { principle: "Count every share." },
    });
    expect(text).toContain("Count the shares");
    expect(text).toContain("What is the technique?");
    expect(text).toContain("does not tell you what to do with your money");
  });
});
