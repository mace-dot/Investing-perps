"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/app-state";
import { EssayPost } from "@/components/essay-post";
import { fieldPrompts, plainDocument, type ComposeKind } from "@/lib/compose-doc";
import { TOPICS } from "@/lib/curriculum/types";
import { safeHttpUrl } from "@/lib/urls";

type Kind = ComposeKind;

const DRAFT_KEY = "investing-reps-composer-draft";

export function Composer({ editId }: { editId?: string }) {
  const app = useApp();
  const router = useRouter();
  const existing = editId ? app.posts.find((post) => post.id === editId && !post.sample) : undefined;
  const [kind, setKind] = useState<Kind>(existing?.type === "thesis" ? "thesis" : "technique");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [topicId, setTopicId] = useState(existing?.topicId ?? "valuation");
  const [fields, setFields] = useState<Record<string, string>>(existing?.fields ?? {});
  const [notes, setNotes] = useState("");
  const [essay, setEssay] = useState(existing?.fields.essay ?? "");
  const [hook, setHook] = useState(existing?.fields.hook ?? "");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceDate, setSourceDate] = useState("");
  const [sources, setSources] = useState(existing?.sources ?? []);
  const [aiAssisted, setAiAssisted] = useState(existing?.aiAssisted ?? false);
  const [preview, setPreview] = useState(false);
  const [suggestion, setSuggestion] = useState<{ targetField: string; suggestion: string; why: string } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editId) return;
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as { kind: Kind; title: string; topicId: string; fields: Record<string, string>; notes?: string; essay?: string; hook?: string };
      setKind(draft.kind);
      setTitle(draft.title);
      setTopicId(draft.topicId);
      setFields(draft.fields);
      setNotes(draft.notes ?? "");
      setEssay(draft.essay ?? "");
      setHook(draft.hook ?? "");
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, [editId]);

  const prompts = fieldPrompts(kind);

  function fieldKey(label: string) {
    return prompts.find((item) => item[1] === label)?.[0] ?? label;
  }

  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ kind, title, topicId, fields, notes, essay, hook }));
    setNote("Draft saved in this browser. It is not in Supabase.");
  }

  function publish() {
    const incomplete = prompts.filter(([key]) => (fields[key] ?? "").trim().length < 10);
    if (title.trim().length < 3 || incomplete.length > 0) {
      setError("Fill the title and each reasoning box with at least a short sentence before publishing.");
      return;
    }
    if (existing) {
      app.updatePost(existing.id, { ...fields, hook, essay }, title.trim());
      router.push(`/posts/${existing.id}`);
      return;
    }
    const id = app.publishPost({
      type: kind,
      authorId: "local-learner",
      authorName: app.profile?.displayName || "Local learner",
      authorKind: "community",
      topicId,
      title: title.trim(),
      clubId: null,
      lessonId: null,
      fields: {
        ...fields,
        hook,
        essay,
        asOf: kind === "thesis" ? new Date().toISOString().slice(0, 10) : "",
      },
      sources,
      aiAssisted,
    });
    localStorage.removeItem(DRAFT_KEY);
    router.push(`/posts/${id}`);
  }

  async function assist(action: "unsupported" | "assumption" | "counter" | "clearer") {
    setNote("Checking the draft. It will not be replaced unless you apply a suggestion.");
    const response = await fetch("/api/ai/composer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, fields: { title, ...fields } }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "The checker failed.");
      return;
    }
    setSuggestion(body.suggestion);
    setNote(body.note ?? "Suggestion only.");
  }

  async function writeFromNotes() {
    setError(null);
    setNote("Turning your notes into a short reading.");
    const response = await fetch("/api/ai/composer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "polish", kind, notes, title }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "The notes could not be turned into a reading.");
      setNote(null);
      return;
    }
    const document = body.document as { title: string; hook: string; essay: string; fields: Record<string, string> };
    setTitle(document.title);
    setHook(document.hook);
    setEssay(document.essay);
    setFields((current) => ({ ...current, ...document.fields }));
    if (body.source === "model") setAiAssisted(true);
    setPreview(true);
    setNote(body.note ?? "Reading ready. Nothing was published.");
  }

  function downloadText() {
    const topic = TOPICS.find((item) => item.id === topicId)?.name ?? topicId;
    const text = plainDocument({ title, topic, essay, prompts, fields });
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "investing-reps-note.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!app.ready) return <p role="status">Loading the composer</p>;
  if (editId && !existing) {
    return <p>That draft is not one of yours on this device. Sample posts stay as samples.</p>;
  }

  return (
    <div>
      <h1 className="text-4xl">{existing ? "Edit post" : "Create"}</h1>
      <p className="mt-2 leading-7 text-muted">
        Start with a few notes. The writer turns them into a short reading with a cover, like a post you can scroll past, and the reasoning stays in the boxes. Publishing in demo mode stays on this device.
      </p>
      <label className="mt-4 block text-sm font-semibold">
        Rough notes
        <textarea
          value={notes}
          maxLength={4000}
          rows={5}
          placeholder="Two or three sentences in your own words."
          onChange={(event) => setNotes(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-line bg-card p-3"
        />
      </label>
      <button type="button" className="btn-primary mt-3" onClick={() => void writeFromNotes()}>
        Write the reading
      </button>
      {!existing ? (
        <div className="mt-4 flex gap-2">
          <button type="button" className={kind === "technique" ? "btn-primary" : "btn-quiet"} onClick={() => setKind("technique")}>Share a technique</button>
          <button type="button" className={kind === "thesis" ? "btn-primary" : "btn-quiet"} onClick={() => setKind("thesis")}>Write a thesis</button>
        </div>
      ) : null}
      <label className="mt-4 block text-sm font-semibold">
        Title
        <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={140} className="mt-2 w-full min-h-11 rounded-2xl border border-line bg-card px-3" />
      </label>
      <label className="mt-3 block text-sm font-semibold">
        Topic
        <select value={topicId} onChange={(event) => setTopicId(event.target.value)} className="mt-2 w-full min-h-11 rounded-2xl border border-line bg-card px-3">
          {TOPICS.map((topic) => (
            <option key={topic.id} value={topic.id}>{topic.name}</option>
          ))}
        </select>
      </label>
      {prompts.map(([key, label]) => (
        <label key={key} className="mt-3 block text-sm font-semibold">
          {label}
          <textarea
            value={fields[key] ?? ""}
            maxLength={2000}
            rows={4}
            onChange={(event) => setFields((current) => ({ ...current, [key]: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-line bg-card p-3"
          />
        </label>
      ))}
      <fieldset className="mt-4 rounded-3xl border border-line p-4">
        <legend className="px-2 text-sm font-semibold">Optional source, labeled author-provided</legend>
        <input value={sourceTitle} onChange={(event) => setSourceTitle(event.target.value)} placeholder="Title" className="mt-2 w-full min-h-11 rounded-2xl border border-line px-3" />
        <input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://" className="mt-2 w-full min-h-11 rounded-2xl border border-line px-3" />
        <input value={sourceDate} onChange={(event) => setSourceDate(event.target.value)} placeholder="Date or year" className="mt-2 w-full min-h-11 rounded-2xl border border-line px-3" />
        <button
          type="button"
          className="btn-quiet mt-2"
          onClick={() => {
            const url = safeHttpUrl(sourceUrl);
            if (!url || sourceTitle.trim().length < 2) {
              setError("Use an http or https link and a title. Other links are ignored.");
              return;
            }
            setSources((current) => [...current, { title: sourceTitle.trim(), url, date: sourceDate.trim() || "undated" }].slice(0, 5));
            setSourceTitle("");
            setSourceUrl("");
            setSourceDate("");
            setError(null);
          }}
        >
          Add source
        </button>
        <ul className="mt-2 text-sm">
          {sources.map((source) => (
            <li key={source.url}>{source.title} · author-provided · {source.date}</li>
          ))}
        </ul>
      </fieldset>
      <label className="mt-4 flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" checked={aiAssisted} onChange={(event) => setAiAssisted(event.target.checked)} />
        AI-assisted disclosure. This does not mean the writing was checked for accuracy.
      </label>
      <p className="mt-2 text-sm leading-6 text-muted">If you ask for a suggestion, the draft text is sent to the configured AI provider. Nothing is published for you.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-quiet" onClick={() => assist("unsupported")}>Identify an unsupported claim</button>
        <button type="button" className="btn-quiet" onClick={() => assist("assumption")}>Find a missing assumption</button>
        <button type="button" className="btn-quiet" onClick={() => assist("counter")}>Suggest a counterargument</button>
        <button type="button" className="btn-quiet" onClick={() => assist("clearer")}>Make this clearer</button>
      </div>
      {suggestion ? (
        <div className="mt-3 rounded-3xl bg-card p-4">
          <p className="text-sm font-semibold">Proposed edit for {suggestion.targetField}</p>
          <p className="mt-2 leading-7">{suggestion.suggestion}</p>
          <p className="mt-2 text-sm text-muted">{suggestion.why}</p>
          <button
            type="button"
            className="btn-primary mt-3"
            onClick={() => {
              const key = fieldKey(suggestion.targetField) || suggestion.targetField;
              setFields((current) => ({ ...current, [key]: suggestion.suggestion }));
              setAiAssisted(true);
              setSuggestion(null);
            }}
          >
            Apply this suggestion
          </button>
        </div>
      ) : null}
      {error ? <p className="mt-3 text-sm text-danger" role="alert">{error}</p> : null}
      {note ? <p className="mt-3 text-sm" role="status">{note}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-quiet" onClick={saveDraft}>Save draft</button>
        <button type="button" className="btn-quiet" onClick={() => setPreview((value) => !value)}>{preview ? "Hide preview" : "Preview"}</button>
        <button type="button" className="btn-quiet" onClick={downloadText}>Download text</button>
        <button type="button" className="btn-primary" onClick={publish}>{existing ? "Save edit" : "Publish"}</button>
      </div>
      {preview ? (
        <div className="mt-4">
          <EssayPost
            title={title}
            hook={hook || fields.principle || fields.claim || ""}
            essay={essay}
            topic={TOPICS.find((topic) => topic.id === topicId)?.name ?? topicId}
            kicker="Preview · a reading, not a transaction"
          />
          <div className="mx-auto mt-4 max-w-prose">
            {prompts.map(([key, label]) => (
              <p key={key} className="mt-3 leading-7"><span className="text-sm font-semibold text-plum">{label} </span>{fields[key]}</p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
