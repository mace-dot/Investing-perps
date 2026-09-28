import { z } from "zod";
import { EdgarError, pullFiling, readingFromUpload } from "@/lib/filings/edgar";
import { narrateReading } from "@/lib/filings/narrate";
import { textFromUpload } from "@/lib/filings/upload-text";
import { takeRateToken } from "@/lib/rate-limit";

const goalSchema = z.enum(["stability", "growth", "income"]);
const periodSchema = z.enum(["annual", "quarter"]);

export async function POST(request: Request) {
  const limit = takeRateToken({
    key: `filings:${request.headers.get("x-forwarded-for") ?? "local"}`,
    limit: 12,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.allowed) {
    return Response.json({ error: "Too many filing reads in a short window. Wait a few minutes and try again." }, { status: 429 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let query = "";
  let goalRaw = "";
  let periodRaw = "annual";
  let uploadText = "";
  let uploadName = "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    if (!form) return Response.json({ error: "The upload could not be read." }, { status: 400 });
    query = String(form.get("query") ?? "");
    goalRaw = String(form.get("goal") ?? "");
    periodRaw = String(form.get("period") ?? "annual");
    const file = form.get("file");
    if (file instanceof Blob && file.size > 0) {
      const name = "name" in file && typeof file.name === "string" ? file.name : "upload.txt";
      const extracted = await textFromUpload(name, new Uint8Array(await file.arrayBuffer()));
      if (!extracted.ok) return Response.json({ error: extracted.error }, { status: 400 });
      uploadText = extracted.text;
      uploadName = name;
    }
  } else {
    const body = z.object({
      query: z.string().max(80).optional(),
      goal: goalSchema,
      period: periodSchema.optional(),
    }).safeParse(await request.json().catch(() => null));
    if (!body.success) return Response.json({ error: "Choose a goal, then enter a company or upload a filing." }, { status: 400 });
    query = body.data.query ?? "";
    goalRaw = body.data.goal;
    periodRaw = body.data.period ?? "annual";
  }

  const goal = goalSchema.safeParse(goalRaw);
  const period = periodSchema.safeParse(periodRaw);
  if (!goal.success) return Response.json({ error: "Choose what kind of pattern you want to compare the filing with." }, { status: 400 });
  if (!period.success) return Response.json({ error: "Choose the latest year or the latest quarter." }, { status: 400 });
  if (!query.trim() && !uploadText) {
    return Response.json({ error: "Enter a ticker or company name, or upload a 10-K." }, { status: 400 });
  }

  try {
    if (!query.trim()) {
      const reading = await narrateReading(readingFromUpload({ fileName: uploadName, text: uploadText, goal: goal.data }));
      return Response.json({ kind: "reading", reading });
    }
    const result = await pullFiling({ query, goal: goal.data, period: period.data, uploadText });
    if (result.kind === "choose") return Response.json(result);
    return Response.json({ kind: "reading", reading: await narrateReading(result.reading) });
  } catch (error) {
    const message = error instanceof EdgarError ? error.message : "The filing could not be read.";
    const status = message.startsWith("No public company") ? 404 : 502;
    return Response.json({ error: message }, { status });
  }
}
