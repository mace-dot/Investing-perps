"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp } from "@/components/app-state";
import { LESSONS } from "@/lib/curriculum/public-lessons";
import { postReadingMinutes, type DemoPost } from "@/lib/demo-data";
import { filterFeed, type FeedFilter } from "@/lib/feed";
import { flagContent } from "@/lib/moderation";

const FILTERS: { id: FeedFilter; label: string }[] = [
  { id: "for_you", label: "For You" },
  { id: "following", label: "Following" },
  { id: "club", label: "Your Club" },
];

export function FeedScreen() {
  const app = useApp();
  const [filter, setFilter] = useState<FeedFilter>("for_you");
  const [menu, setMenu] = useState<string | null>(null);

  const mistakeTopics = useMemo(() => {
    const topicIds = app.attempts
      .filter((attempt) => !attempt.correct || attempt.contradicts)
      .map((attempt) => LESSONS.find((lesson) => lesson.id === attempt.lessonId)?.topicId)
      .filter((topicId): topicId is NonNullable<typeof topicId> => Boolean(topicId));
    return [...new Set(topicIds)];
  }, [app.attempts]);

  if (!app.ready) return <Loading label="Loading the feed" />;

  const visiblePosts = app.posts.filter((post) => !app.blocks.includes(post.authorId) && !app.hiddenIds.includes(post.id));
  const candidates = visiblePosts.map((post) => ({
    id: post.id,
    authorId: post.authorId,
    authorName: post.authorName,
    topicId: post.topicId,
    topicName: post.topicName,
    clubId: post.clubId,
    createdAt: post.createdAt,
    viewed: app.viewed.includes(post.id),
  }));

  const result = filterFeed(candidates, filter, {
    interestTopicIds: app.profile?.interests ?? [],
    mistakeTopicIds: mistakeTopics,
    followedAuthorIds: app.follows,
    clubId: app.profile?.clubCode === "CAMPUS-DEMO" ? "north-quad" : null,
  });
  const items = result.items;

  const noFollows = filter === "following" && app.follows.length === 0;
  const noClub = filter === "club" && app.profile?.clubCode !== "CAMPUS-DEMO";

  return (
    <div>
      <p className="text-sm font-semibold text-plum">Sample curriculum, needs review</p>
      <h1 className="mt-1 text-4xl">Feed</h1>
      <p className="mt-2 max-w-xl text-base leading-7 text-muted">
        For You uses your topics, recent misses, people you follow, and posts you have not opened. It is not an AI ranking, and popularity is not evidence.
      </p>
      <div className="mt-4 flex gap-2 overflow-x-auto" role="tablist" aria-label="Feed filters">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold ${filter === item.id ? "bg-ink text-white" : "bg-card text-ink"}`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-4">
        {noFollows ? (
          <EmptyState title="You are not following anyone yet." body="Following is saved on this device in demo mode. Open a sample post and follow its author if you want this tab to fill." />
        ) : null}
        {noClub ? (
          <EmptyState title="No club yet." body="Join the sample club with the invitation code CAMPUS-DEMO. Club posts stay hidden until you do." action={<Link href="/onboarding" className="btn-primary">Enter a club code</Link>} />
        ) : null}
        {!noFollows && !noClub && items.length === 0 ? (
          <CaughtUp />
        ) : null}
        {items.map((item) => {
          const post = visiblePosts.find((entry) => entry.id === item.id);
          if (!post) return null;
          return (
            <PostCard
              key={post.id}
              post={post}
              why={filter === "for_you" ? item.why : null}
              menuOpen={menu === post.id}
              onMenu={() => setMenu(menu === post.id ? null : post.id)}
            />
          );
        })}
        {items.length > 0 ? <CaughtUp /> : null}
      </div>
    </div>
  );
}

function PostCard({
  post,
  why,
  menuOpen,
  onMenu,
}: {
  post: DemoPost;
  why: string | null;
  menuOpen: boolean;
  onMenu: () => void;
}) {
  const app = useApp();
  const flags = flagContent(Object.values(post.fields).join(" "));
  return (
    <article className="rounded-3xl border border-line bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">
            {post.authorName}
            {post.sample ? " · Fictional sample" : " · On this device"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge>{post.topicName}</Badge>
            <Badge>{post.type}</Badge>
            <Badge>{post.authorKind === "editorial" ? "Sample curriculum · needs review" : "Community post"}</Badge>
            <Badge>{postReadingMinutes(post)} min</Badge>
          </div>
        </div>
        <button type="button" className="min-h-11 min-w-11 rounded-full border border-line" aria-expanded={menuOpen} aria-label="Report or block" onClick={onMenu}>
          ···
        </button>
      </div>
      {menuOpen ? (
        <div className="mt-3 grid gap-2 rounded-2xl bg-paper p-3">
          <button
            type="button"
            className="min-h-11 text-left text-sm"
            onClick={() => {
              const reason = window.prompt("Why are you reporting this? A person would review it. Automated flags are not a final decision.");
              if (reason && reason.trim()) app.report({ targetType: "post", targetId: post.id, reason: reason.trim() });
            }}
          >
            Report post
          </button>
          {post.authorKind === "community" ? (
            <button type="button" className="min-h-11 text-left text-sm" onClick={() => app.blockAuthor(post.authorId)}>
              Block {post.authorName}
            </button>
          ) : null}
        </div>
      ) : null}
      <h2 className="mt-3 text-2xl">
        <Link href={`/posts/${post.id}`} onClick={() => app.markViewed(post.id)}>
          {post.title}
        </Link>
      </h2>
      <p className="mt-2 text-base leading-7">{Object.values(post.fields)[0]}</p>
      {post.type === "thesis" ? <p className="mt-2 text-sm text-muted">An educational discussion, not a trading signal.</p> : null}
      {post.type === "challenge" ? (
        <p className="mt-2 text-sm text-muted">Only editorially approved curriculum challenges count toward rankings. This sample is still needs review.</p>
      ) : null}
      {why ? <p className="mt-3 text-sm leading-6 text-plum">Why am I seeing this? {why}</p> : null}
      {flags.length > 0 ? <p className="mt-2 text-sm text-danger">{flags[0]?.message} This check can be wrong.</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-quiet" onClick={() => app.toggleSave(post.id)}>
          {app.saved.includes(post.id) ? "Saved" : "Save"}
        </button>
        <button type="button" className="btn-quiet" onClick={() => app.toggleHelpful(post.id)}>
          {app.helpful.includes(post.id) ? "Helpful marked" : "Helpful"}
        </button>
        <Link href={`/posts/${post.id}`} className="btn-quiet" onClick={() => app.markViewed(post.id)}>
          Comment
        </Link>
        {post.lessonId ? (
          <Link href={`/practice/${post.lessonId}`} className="btn-primary">
            Practice
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-paper px-2 py-1 text-xs font-semibold text-ink">{children}</span>;
}

function CaughtUp() {
  return (
    <section className="rounded-3xl border border-dashed border-line bg-card px-4 py-8 text-center">
      <h2 className="text-2xl">You’re caught up</h2>
      <p className="mt-2 text-sm leading-6 text-muted">This version stops here on purpose. It does not keep loading older posts to look endless.</p>
    </section>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-card p-5">
      <h2 className="text-2xl">{title}</h2>
      <p className="mt-2 text-base leading-7 text-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}

export function ErrorState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-danger/30 bg-card p-5" role="alert">
      <h2 className="text-2xl">{title}</h2>
      <p className="mt-2 leading-7">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <p className="rounded-3xl border border-line bg-card px-4 py-8 text-center" role="status">
      {label}
    </p>
  );
}
