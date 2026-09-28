import { htmlToPlain } from "@/lib/filings/excerpts";

const MAX_BYTES = 8_000_000;

export async function textFromUpload(name: string, bytes: Uint8Array): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  if (bytes.byteLength === 0) return { ok: false, error: "That file was empty." };
  if (bytes.byteLength > MAX_BYTES) {
    return { ok: false, error: "That file is larger than 8 megabytes. Look the company up instead, and the app will pull the filing from the SEC." };
  }
  const head = new TextDecoder().decode(bytes.slice(0, 8));
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf") || head.startsWith("%PDF")) {
    try {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(bytes);
      const extracted = await extractText(pdf, { mergePages: true });
      const text = Array.isArray(extracted.text) ? extracted.text.join("\n") : String(extracted.text ?? "");
      if (text.trim().length < 40) {
        return { ok: false, error: "That PDF did not contain readable text. Look the company up, or upload the HTML filing." };
      }
      return { ok: true, text: text.slice(0, 180_000) };
    } catch {
      return { ok: false, error: "That PDF could not be read. Look the company up, or upload the filing as HTML or text." };
    }
  }
  const raw = new TextDecoder().decode(bytes);
  const text = /<html|<body|<p\b|<div\b/i.test(raw) ? htmlToPlain(raw) : raw;
  if (text.trim().length < 40) return { ok: false, error: "That file did not contain enough text to read." };
  return { ok: true, text: text.slice(0, 180_000) };
}
