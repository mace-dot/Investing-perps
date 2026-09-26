"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { SAMPLE_CLUB, SAMPLE_COMMENTS, SAMPLE_POSTS, type DemoComment, type DemoPost, type PostType, type SourceDraft } from "@/lib/demo-data";
import { LESSONS } from "@/lib/curriculum/public-lessons";
import { TOPICS } from "@/lib/curriculum/types";

export type Confidence = "unsure" | "somewhat_sure" | "very_sure";

export type StoredAttempt = {
  questionId: string;
  lessonId: string;
  role: "initial" | "transfer";
  choiceId: string;
  explanation: string;
  confidence: Confidence;
  correct: boolean;
  hintUsed: boolean;
  contradicts: boolean;
  countsForAccuracy: boolean;
  points: number;
  misconceptionTag: string | null;
  at: number;
};

export type Profile = {
  displayName: string;
  experience: "beginner" | "some";
  interests: string[];
  bio: string;
  clubCode: string | null;
  showOnGlobalRanking: boolean;
  onboardingDone: boolean;
};

export type Report = {
  id: string;
  targetType: "post" | "comment";
  targetId: string;
  reason: string;
  at: number;
};

export type Removal = {
  id: string;
  targetType: "post" | "comment";
  targetId: string;
  reason: string;
  at: number;
  sample: boolean;
};

type State = {
  profile: Profile | null;
  attempts: StoredAttempt[];
  viewed: string[];
  saved: string[];
  helpful: string[];
  follows: string[];
  blocks: string[];
  posts: DemoPost[];
  comments: DemoComment[];
  reports: Report[];
  removals: Removal[];
  hiddenIds: string[];
  reviewedTags: string[];
  notice: string | null;
};

const STORAGE_KEY = "investing-reps-demo-v1";

const empty: State = {
  profile: null,
  attempts: [],
  viewed: [],
  saved: [],
  helpful: [],
  follows: [],
  blocks: [],
  posts: SAMPLE_POSTS,
  comments: SAMPLE_COMMENTS,
  reports: [],
  removals: [],
  hiddenIds: [],
  reviewedTags: [],
  notice: null,
};

const DEMO_NOTE = "Saved on this device only. Demo mode does not write to Supabase or to the Favos database.";

type AppContextValue = State & {
  ready: boolean;
  mode: "demo" | "live";
  modeReason: string;
  clearNotice: () => void;
  saveProfile: (profile: Profile) => void;
  recordAttempt: (attempt: StoredAttempt) => void;
  markViewed: (postId: string) => void;
  toggleSave: (postId: string) => void;
  toggleHelpful: (postId: string) => void;
  toggleFollow: (authorId: string) => void;
  blockAuthor: (authorId: string) => void;
  report: (report: Omit<Report, "id" | "at">) => void;
  removeWithReason: (removal: Omit<Removal, "id" | "at" | "sample">) => void;
  publishPost: (post: Omit<DemoPost, "id" | "createdAt" | "editedAt" | "sample" | "topicName">) => string;
  updatePost: (id: string, fields: Record<string, string>, title: string) => void;
  deletePost: (id: string) => void;
  addComment: (comment: Omit<DemoComment, "id" | "createdAt" | "sample">) => void;
  markTagReviewed: (tag: string) => void;
  resetDemo: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function loadState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      ...empty,
      ...parsed,
      posts: [...SAMPLE_POSTS.filter((post) => !(parsed.hiddenIds ?? []).includes(post.id)), ...(parsed.posts ?? []).filter((post) => !post.sample)],
      comments: [...SAMPLE_COMMENTS, ...(parsed.comments ?? []).filter((comment) => !comment.sample)],
      notice: null,
    };
  } catch {
    return empty;
  }
}

export function AppState({
  children,
  mode,
  modeReason,
}: {
  children: React.ReactNode;
  mode: "demo" | "live";
  modeReason: string;
}) {
  const [state, setState] = useState<State>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const { notice: _notice, ...persist } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persist));
  }, [state, ready]);

  const value = useMemo<AppContextValue>(() => {
    const update = (recipe: (current: State) => State) => {
      setState((current) => recipe(current));
    };

    return {
      ...state,
      ready,
      mode,
      modeReason,
      clearNotice: () => update((current) => ({ ...current, notice: null })),
      saveProfile: (profile) => update((current) => ({ ...current, profile, notice: DEMO_NOTE })),
      recordAttempt: (attempt) =>
        update((current) => ({
          ...current,
          attempts: [...current.attempts, attempt],
          notice: `${DEMO_NOTE} Points on the sample board did not change.`,
        })),
      markViewed: (postId) =>
        update((current) => ({
          ...current,
          viewed: current.viewed.includes(postId) ? current.viewed : [...current.viewed, postId],
        })),
      toggleSave: (postId) =>
        update((current) => ({
          ...current,
          saved: current.saved.includes(postId) ? current.saved.filter((id) => id !== postId) : [...current.saved, postId],
          notice: DEMO_NOTE,
        })),
      toggleHelpful: (postId) =>
        update((current) => ({
          ...current,
          helpful: current.helpful.includes(postId) ? current.helpful.filter((id) => id !== postId) : [...current.helpful, postId],
          notice: "Helpful is a reaction, not evidence that a claim is true. " + DEMO_NOTE,
        })),
      toggleFollow: (authorId) =>
        update((current) => ({
          ...current,
          follows: current.follows.includes(authorId) ? current.follows.filter((id) => id !== authorId) : [...current.follows, authorId],
          notice: DEMO_NOTE,
        })),
      blockAuthor: (authorId) =>
        update((current) => ({
          ...current,
          blocks: current.blocks.includes(authorId) ? current.blocks : [...current.blocks, authorId],
          notice: DEMO_NOTE,
        })),
      report: (report) =>
        update((current) => ({
          ...current,
          reports: [...current.reports, { ...report, id: crypto.randomUUID(), at: Date.now() }],
          notice: "Report saved on this device. In demo mode it is not sent to a moderator queue in Supabase.",
        })),
      removeWithReason: (removal) =>
        update((current) => ({
          ...current,
          removals: [...current.removals, { ...removal, id: crypto.randomUUID(), at: Date.now(), sample: true }],
          hiddenIds: [...current.hiddenIds, removal.targetId],
          posts: current.posts.filter((post) => post.id !== removal.targetId),
          notice: "Sample removal recorded on this device only, with the reason you wrote. This does not change the investing perps database.",
        })),
      publishPost: (post) => {
        const id = crypto.randomUUID();
        const topicName = TOPICS.find((topic) => topic.id === post.topicId)?.name ?? post.topicId;
        update((current) => ({
          ...current,
          posts: [
            {
              ...post,
              id,
              topicName,
              sample: false,
              createdAt: Date.now(),
              editedAt: null,
            },
            ...current.posts,
          ],
          notice: DEMO_NOTE,
        }));
        return id;
      },
      updatePost: (id, fields, title) =>
        update((current) => ({
          ...current,
          posts: current.posts.map((post) => (post.id === id ? { ...post, fields, title, editedAt: Date.now() } : post)),
          notice: DEMO_NOTE,
        })),
      deletePost: (id) =>
        update((current) => ({
          ...current,
          posts: current.posts.filter((post) => post.id !== id),
          hiddenIds: [...current.hiddenIds, id],
          notice: DEMO_NOTE,
        })),
      addComment: (comment) =>
        update((current) => ({
          ...current,
          comments: [
            ...current.comments,
            { ...comment, id: crypto.randomUUID(), createdAt: Date.now(), sample: false },
          ],
          notice: DEMO_NOTE,
        })),
      markTagReviewed: (tag) =>
        update((current) => ({
          ...current,
          reviewedTags: current.reviewedTags.includes(tag) ? current.reviewedTags : [...current.reviewedTags, tag],
        })),
      resetDemo: () => {
        localStorage.removeItem(STORAGE_KEY);
        setState(empty);
      },
    };
  }, [mode, modeReason, ready, state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppState");
  return value;
}

export function accuracyFrom(attempts: StoredAttempt[], role?: "initial" | "transfer") {
  const first = new Map<string, StoredAttempt>();
  for (const attempt of attempts) {
    if (!attempt.countsForAccuracy) continue;
    if (role && attempt.role !== role) continue;
    if (!first.has(attempt.questionId)) first.set(attempt.questionId, attempt);
  }
  const rows = [...first.values()];
  return { correct: rows.filter((row) => row.correct).length, attempted: rows.length };
}

export function lessonProgress(attempts: StoredAttempt[], lessonId: string) {
  const lesson = LESSONS.find((item) => item.id === lessonId);
  if (!lesson) return { done: false, initial: false, transfer: false };
  const initial = attempts.some((attempt) => attempt.questionId === lesson.initial.id);
  const transfer = attempts.some((attempt) => attempt.questionId === lesson.transfer.id);
  return { done: initial && transfer, initial, transfer };
}

export type { DemoPost, PostType, SourceDraft };
