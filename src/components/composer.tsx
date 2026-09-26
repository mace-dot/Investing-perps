"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/app-state";
import { TOPICS } from "@/lib/curriculum/types";
import { safeHttpUrl } from "@/lib/urls";

type Kind = "technique" | "thesis";

const TECHNIQUE = [
  ["principle", "What is the technique?"],
  ["example", "Show an example"],
  ["whenUseful", "When would someone use it?"],
  ["whenItFails", "When might it mislead?"],
] as const;

const THESIS = [
  ["claim", "What do you believe?"],
  ["evidence", "What evidence supports it?"],
  ["assumptions", "What assumptions must hold?"],
  ["counterargument", "What is the strongest counterargument?"],
  ["changeMind", "What would change your mind?"],
] as const;

const DRAFT_KEY = "investing-reps-composer-draft";

export function Composer({ editId }: { editId?: string }) {
  const app = useApp();
  const router = useRouter();
  const existing = editId ? app.posts.find((post) => post.id === editId && !post.sample) : undefined;
  const [kind, setKind] = useState<Kind>(existing?.type === "thesis" ? "thesis" : "technique");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [topicId, setTopicId] = useState(existing?.topicId ?? "valuation");
  const [fields, setFields] = useState<Record<string, string>>(existing?.fields ?? {});
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
      const draft = JSON.parse(raw) as { kind: Kind; title: string; topicId: string; fields: Record<string, string> };
      setKind(draft.kind);
      setTitle(draft.title);
      setTopicId(draft.topicId);
      setFields(draft.fields);
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, [editId]);

  const prompts = kind === "technique" ? TECHNIQUE : THESIS;

  function fieldKey(label: string) {
    return prompts.find((item) => item[1] === label)?.[0] ?? label;
  }

  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ kind, title, topicId, fields }));
    setNote("Draft saved in this browser. It is not in Supabase.");
  }

  function publish() {
    const incomplete = prompts.filter(([key]) => (fields[key] ?? "").trim().length < 10);
    if (title.trim().length < 3 || incomplete.length > 0) {
      setError("Fill the title and each reasoning box with at least a short sentence before publishing.");
      return;
    }
    if (existing) {
      app.updatePost(existing.id, fields, title.trim());
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
      fields: { ...fields, asOf: kind === "thesis" ? new Date().toISOString().slice(0, 10) : "" },
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

  if (!app.ready) return <p role="status">Loading the composer</p>;
  if (editId && !existing) {
    return <p>That draft is not one of yours on this device. Sample posts stay as samples.</p>;
  }

  return (
    <div>
      <h1 className="text-4xl">{existing ? "Edit post" : "Create"}</h1>
      <p className="mt-2 leading-7 text-muted">Guided fields, not a blank box. Publishing in demo mode stays on this device.</p>
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
        <button type="button" className="btn-primary" onClick={publish}>{existing ? "Save edit" : "Publish"}</button>
      </div>
      {preview ? (
        <article className="mt-4 rounded-3xl border border-line bg-card p-4">
          <p className="text-sm text-plum">Preview · community post · not a trading signal</p>
          <h2 className="mt-2 text-2xl">{title || "Untitled"}</h2>
          {prompts.map(([key, label]) => (
            <p key={key} className="mt-2 leading-7"><span className="font-semibold">{label} </span>{fields[key]}</p>
          ))}
          {kind === "thesis" ? <p className="mt-2 text-sm">An educational discussion, not a trading signal.</p> : null}
        </article>
      ) : null}
    </div>
  );
}
