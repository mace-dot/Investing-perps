"use client";

import Link from "next/link";
import { useState } from "react";
import { accuracyFrom, lessonProgress, useApp } from "@/components/app-state";
import { EssayPost } from "@/components/essay-post";
import { EmptyState } from "@/components/feed-screen";
import { fieldPrompts } from "@/lib/compose-doc";
import { COMMUNITY_RULES, SAMPLE_RANKING, postReadingMinutes } from "@/lib/demo-data";
import { FRAMEWORKS, IDEA_TENSIONS } from "@/lib/curriculum/frameworks";
import { LESSONS } from "@/lib/curriculum/public-lessons";
import { TOPICS } from "@/lib/curriculum/types";
import { GOAL_LABELS } from "@/lib/filings/types";
import { accuracyLabel } from "@/lib/scoring";

export function RankingsScreen() {
  const app = useApp();
  const [scope, setScope] = useState<"club" | "global">("club");
  if (!app.ready) return <p role="status">Loading rankings</p>;
  const localCorrect = app.attempts.filter((attempt) => attempt.countsForAccuracy && attempt.correct).length;
  const localAttempted = app.attempts.filter((attempt) => attempt.countsForAccuracy).length;
  return (
    <div>
      <h1 className="text-4xl">Rankings</h1>
      <p className="mt-2 text-lg leading-7">Learning challenge rankings—not investment performance.</p>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
        This is a low-stakes practice board. It cannot prove the work was independent, and it does not measure investing skill, expected returns, or expertise. Ties share a rank. Speed is not a tiebreaker.
      </p>
      <div className="mt-4 flex gap-2">
        <button type="button" className={scope === "club" ? "btn-primary" : "btn-quiet"} onClick={() => setScope("club")}>Your Club</button>
        <button type="button" className={scope === "global" ? "btn-primary" : "btn-quiet"} onClick={() => setScope("global")}>Global, opt-in</button>
      </div>
      {scope === "global" && !app.profile?.showOnGlobalRanking ? (
        <p className="mt-4 rounded-3xl bg-card p-4 text-sm leading-6">Global ranking is off for you by default. Opt in from your profile if you want a public display name on a future live board.</p>
      ) : null}
      <section className="mt-4 rounded-3xl border border-plum/40 bg-card p-4">
        <p className="text-sm font-semibold text-plum">Sample data. Not real people and not the live investing perps board.</p>
        <ol className="mt-3 grid gap-2">
          {SAMPLE_RANKING.map((row) => (
            <li key={row.displayName} className="grid grid-cols-[auto_1fr_auto] gap-3 rounded-2xl bg-paper px-3 py-3 text-sm">
              <span>{row.rank}</span>
              <span>{row.displayName}</span>
              <span>{row.points} pts · {row.correct} of {row.attempted}</span>
            </li>
          ))}
        </ol>
      </section>
      <section className="mt-4 rounded-3xl border border-line bg-card p-4">
        <h2 className="text-xl">Your local demo tally</h2>
        <p className="mt-2 text-sm leading-6">These numbers are not ranked. Lessons are still needs review, so ranking points stay at zero.</p>
        <p className="mt-2">Eligible answers: {accuracyLabel(localCorrect, localAttempted)}</p>
      </section>
      {app.profile?.clubCode !== "CAMPUS-DEMO" && scope === "club" ? (
        <div className="mt-4">
          <EmptyState title="Join a club to see a club practice list." body="The sample code is CAMPUS-DEMO. A live board appears only after the investing perps project is connected and people opt in." />
        </div>
      ) : null}
    </div>
  );
}

export function ProfileScreen() {
  const app = useApp();
  if (!app.ready) return <p role="status">Loading profile</p>;
  const name = app.profile?.displayName ?? "Guest";
  const initial = accuracyFrom(app.attempts, "initial");
  const transfer = accuracyFrom(app.attempts, "transfer");
  const valuationDone = ["valuation-whole-business", "valuation-same-business-price", "expectations-two-prices"].filter((id) => lessonProgress(app.attempts, id).done).length;
  const misses = app.attempts.filter((attempt) => attempt.misconceptionTag);
  const mine = app.posts.filter((post) => post.authorId === "local-learner");
  const saved = app.posts.filter((post) => app.saved.includes(post.id));
  const completed = LESSONS.filter((lesson) => lessonProgress(app.attempts, lesson.id).done);
  return (
    <div>
      <p className="text-sm text-muted">Public profile</p>
      <h1 className="text-4xl">{name}</h1>
      <p className="mt-2 leading-7">{app.profile?.bio || "No bio yet."}</p>
      <p className="mt-1 text-sm">{app.profile?.clubCode === "CAMPUS-DEMO" ? "Sample club: North Quad Investment Club" : "No club"}</p>
      <p className="mt-1 text-sm">Global ranking: {app.profile?.showOnGlobalRanking ? "Opted in" : "Excluded by default"}</p>
      <p className="mt-1 text-sm">Goal: {app.investingGoal ? GOAL_LABELS[app.investingGoal] : "Not chosen yet. The feed uses it to order the scroll."}</p>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted">A brokerage is not connected. Linking one is not available. This app does not place trades or tell you what to buy or sell.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/onboarding" className="btn-primary">Edit profile</Link>
        <Link href="/settings" className="btn-quiet">Export or delete</Link>
      </div>
      <section className="mt-6">
        <h2 className="text-2xl">Published here</h2>
        {mine.length === 0 ? <p className="mt-2 text-sm text-muted">You have not published on this device.</p> : null}
        <ul className="mt-2 grid gap-2">
          {mine.map((post) => (
            <li key={post.id}><Link href={`/posts/${post.id}`}>{post.title}</Link></li>
          ))}
        </ul>
      </section>
      <section className="mt-6 rounded-3xl border border-line bg-card p-4">
        <h2 className="text-2xl">Private learning</h2>
        <p className="mt-2 text-sm leading-6">Only you see this section on this device. It is not part of the public profile.</p>
        <p className="mt-3">Initial-answer accuracy: {accuracyLabel(initial.correct, initial.attempted)}</p>
        <p>Transfer-question accuracy: {accuracyLabel(transfer.correct, transfer.attempted)}</p>
        <h3 className="mt-4 text-xl">Completed lessons</h3>
        {completed.length === 0 ? <p className="text-sm text-muted">None yet. The first lesson takes a few minutes.</p> : (
          <ul className="mt-2 text-sm">{completed.map((lesson) => <li key={lesson.id}>{lesson.streetTitle}</li>)}</ul>
        )}
        <h3 className="mt-4 text-xl">Saved lessons and posts</h3>
        {saved.length === 0 ? <p className="text-sm text-muted">Nothing saved.</p> : (
          <ul className="mt-2 text-sm">{saved.map((post) => <li key={post.id}>{post.title}</li>)}</ul>
        )}
        <h3 className="mt-4 text-xl">Misconceptions</h3>
        {misses.length === 0 ? <p className="text-sm text-muted">None recorded yet.</p> : (
          <ul className="mt-2 text-sm">
            {misses.map((attempt) => (
              <li key={`${attempt.questionId}-${attempt.at}`}>
                {attempt.misconceptionTag}
                {app.reviewedTags.includes(attempt.misconceptionTag ?? "") ? " · reviewed" : ""}
              </li>
            ))}
          </ul>
        )}
        <h3 className="mt-4 text-xl">Suggested review</h3>
        <p className="text-sm leading-6">{misses[0]?.misconceptionTag ? `Look again at ${misses[0].misconceptionTag.replaceAll("_", " ")}.` : "Finish a lesson and the suggestion will come from a miss, not from a generic score."}</p>
        <h3 className="mt-4 text-xl">Achievements</h3>
        <ul className="mt-2 grid gap-2 text-sm">
          <li className="rounded-2xl bg-paper px-3 py-2">{valuationDone >= 3 ? "Earned" : "Locked"}: Three lessons on what a price means</li>
          <li className="rounded-2xl bg-paper px-3 py-2">{completed.length > 0 ? "Earned" : "Locked"}: Finished a lesson pair. This is not an investor badge.</li>
          <li className="rounded-2xl bg-paper px-3 py-2">{app.reviewedTags.length > 0 ? "Earned" : "Locked"}: Returned to review a difficult concept</li>
        </ul>
      </section>
    </div>
  );
}

export function OnboardingScreen() {
  const app = useApp();
  const [name, setName] = useState(app.profile?.displayName ?? "");
  const [experience, setExperience] = useState<"beginner" | "some">(app.profile?.experience ?? "beginner");
  const [interests, setInterests] = useState<string[]>(app.profile?.interests ?? []);
  const [clubCode, setClubCode] = useState(app.profile?.clubCode ?? "");
  const [bio, setBio] = useState(app.profile?.bio ?? "");
  const [ranking, setRanking] = useState(app.profile?.showOnGlobalRanking ?? false);
  const [message, setMessage] = useState<string | null>(null);

  function toggleInterest(id: string) {
    setInterests((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  }

  if (!app.ready) return <p role="status">Loading onboarding</p>;

  return (
    <div>
      <h1 className="text-4xl">Start where you are</h1>
      <p className="mt-2 leading-7">A display name, a rough experience level, and up to three interests. The short diagnostic is optional. We do not ask for income, balances, or a brokerage login.</p>
      <label className="mt-4 block text-sm font-semibold">
        Display name
        <input value={name} maxLength={40} onChange={(event) => setName(event.target.value)} className="mt-2 w-full min-h-11 rounded-2xl border border-line px-3" />
      </label>
      <fieldset className="mt-4">
        <legend className="text-sm font-semibold">Experience</legend>
        <label className="mt-2 flex min-h-11 items-center gap-2"><input type="radio" checked={experience === "beginner"} onChange={() => setExperience("beginner")} /> Beginner</label>
        <label className="flex min-h-11 items-center gap-2"><input type="radio" checked={experience === "some"} onChange={() => setExperience("some")} /> Some experience</label>
      </fieldset>
      <fieldset className="mt-4">
        <legend className="text-sm font-semibold">Up to three interests</legend>
        {TOPICS.map((topic) => (
          <label key={topic.id} className="mt-2 flex min-h-11 items-start gap-2">
            <input type="checkbox" checked={interests.includes(topic.id)} onChange={() => toggleInterest(topic.id)} />
            <span>{topic.plain}</span>
          </label>
        ))}
      </fieldset>
      <label className="mt-4 block text-sm font-semibold">
        Optional club code
        <input value={clubCode} onChange={(event) => setClubCode(event.target.value)} className="mt-2 w-full min-h-11 rounded-2xl border border-line px-3" placeholder="CAMPUS-DEMO" />
      </label>
      <label className="mt-4 block text-sm font-semibold">
        Bio
        <textarea value={bio} maxLength={280} onChange={(event) => setBio(event.target.value)} className="mt-2 w-full rounded-2xl border border-line p-3" />
      </label>
      <label className="mt-4 flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" checked={ranking} onChange={(event) => setRanking(event.target.checked)} />
        Show my display name on a future global learning board. Off by default.
      </label>
      <p className="mt-3 text-sm leading-6">A diagnostic is available inside Practice. You can skip it and open the first lesson now. Entering a school name would not make this profile a verified student. There is no verification process yet.</p>
      <button
        type="button"
        className="btn-primary mt-4"
        onClick={() => {
          if (name.trim().length < 2) {
            setMessage("Add a display name with at least two characters.");
            return;
          }
          const code = clubCode.trim().toUpperCase();
          if (code && code !== "CAMPUS-DEMO") {
            setMessage("That code does not match the sample club. Leave it blank or use CAMPUS-DEMO.");
            return;
          }
          app.saveProfile({
            displayName: name.trim(),
            experience,
            interests,
            bio: bio.trim(),
            clubCode: code || null,
            showOnGlobalRanking: ranking,
            onboardingDone: true,
          });
          setMessage("Profile saved on this device.");
        }}
      >
        Save local profile
      </button>
      <Link href="/practice/valuation-whole-business" className="btn-quiet ml-2 mt-4">Skip and start the first lesson</Link>
      {message ? <p className="mt-3 text-sm" role="status">{message}</p> : null}
    </div>
  );
}

export function PostScreen({ postId }: { postId: string }) {
  const app = useApp();
  const [intent, setIntent] = useState<"question" | "evidence" | "assumption">("question");
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  if (!app.ready) return <p role="status">Loading the post</p>;
  const post = app.posts.find((item) => item.id === postId);
  if (!post || app.blocks.includes(post.authorId)) {
    return <EmptyState title="This post is not available." body="It may have been deleted on this device, or you blocked the author." />;
  }
  const comments = app.comments.filter((comment) => comment.postId === post.id && !app.hiddenIds.includes(comment.id));
  return (
    <article>
      <p className="text-sm text-muted">{post.authorName} {post.sample ? "· Fictional sample" : "· On this device"} · {postReadingMinutes(post)} min</p>
      {post.editedAt ? <p className="mt-1 text-sm">Edited {new Date(post.editedAt).toLocaleString()}</p> : null}
      <div className="mt-3">
        <EssayPost
          title={post.title}
          hook={post.fields.hook || firstReading(post.fields)}
          essay={post.fields.essay || ""}
          topic={post.topicName}
          kicker={post.sample ? "Fictional sample · needs review" : "Community reading"}
        />
      </div>
      <div className="mx-auto mt-4 max-w-prose">
        {readingBoxes(post.type, post.fields).map(([label, value]) => (
          <p key={label} className="mt-3 leading-7"><span className="text-sm font-semibold text-plum">{label} </span>{value}</p>
        ))}
      </div>
      {post.type === "thesis" ? <p className="mt-3 text-sm">An educational discussion, not a trading signal. Sources below are author-provided and not fact-checked.</p> : null}
      {post.aiAssisted ? <p className="mt-2 text-sm">The author disclosed AI assistance. That is not a verification of accuracy.</p> : null}
      <ul className="mt-3 text-sm">
        {post.sources.map((source) => (
          <li key={source.url}><a href={source.url} className="underline">{source.title}</a> · author-provided · {source.date}</li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-quiet" onClick={() => app.toggleHelpful(post.id)}>Helpful</button>
        <button type="button" className="btn-quiet" onClick={() => app.toggleSave(post.id)}>Save</button>
        {post.authorKind === "community" ? (
          <button type="button" className="btn-quiet" onClick={() => app.toggleFollow(post.authorId)}>
            {app.follows.includes(post.authorId) ? "Following" : "Follow"}
          </button>
        ) : null}
        {post.lessonId ? <Link className="btn-primary" href={`/practice/${post.lessonId}`}>Open the practice</Link> : null}
        {!post.sample && post.authorId === "local-learner" ? (
          <>
            <Link className="btn-quiet" href={`/create?edit=${post.id}`}>Edit</Link>
            <button type="button" className="btn-quiet" onClick={() => app.deletePost(post.id)}>Delete</button>
          </>
        ) : null}
      </div>
      <section className="mt-6">
        <h2 className="text-2xl">Comments</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["question", "evidence", "assumption"] as const).map((item) => (
            <button key={item} type="button" className={intent === item ? "btn-primary" : "btn-quiet"} onClick={() => setIntent(item)}>
              {item === "question" ? "Ask a question" : item === "evidence" ? "Add evidence" : "Challenge an assumption"}
            </button>
          ))}
        </div>
        <textarea value={body} maxLength={1000} onChange={(event) => setBody(event.target.value)} className="mt-3 w-full rounded-2xl border border-line p-3" rows={3} />
        <button
          type="button"
          className="btn-primary mt-2"
          disabled={body.trim().length < 2 || !app.profile}
          onClick={() => {
            app.addComment({
              postId: post.id,
              parentId: replyTo,
              authorId: "local-learner",
              authorName: app.profile?.displayName || "Local learner",
              intent,
              body: body.trim(),
            });
            setBody("");
            setReplyTo(null);
          }}
        >
          Post comment
        </button>
        {!app.profile ? <p className="mt-2 text-sm">Add a display name in onboarding before commenting. The comment button stays off until then.</p> : null}
        <ul className="mt-4 grid gap-3">
          {comments.filter((comment) => !comment.parentId).map((comment) => (
            <li key={comment.id} className="rounded-3xl bg-card p-4">
              <p className="text-sm text-muted">{comment.authorName} {comment.sample ? "· sample" : ""} · {comment.intent}</p>
              <p className="mt-1 leading-7">{comment.body}</p>
              <button type="button" className="mt-2 min-h-11 text-sm font-semibold text-teal" onClick={() => setReplyTo(comment.id)}>Reply</button>
              <button
                type="button"
                className="ml-3 min-h-11 text-sm"
                onClick={() => {
                  const reason = window.prompt("Why are you reporting this comment?");
                  if (reason?.trim()) app.report({ targetType: "comment", targetId: comment.id, reason: reason.trim() });
                }}
              >
                Report
              </button>
              <ul className="mt-3 grid gap-2 border-l border-line pl-3">
                {comments.filter((reply) => reply.parentId === comment.id).map((reply) => (
                  <li key={reply.id}>
                    <p className="text-sm text-muted">{reply.authorName}</p>
                    <p className="leading-7">{reply.body}</p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        {comments.length === 0 ? <p className="mt-3 text-sm text-muted">No comments yet.</p> : null}
      </section>
    </article>
  );
}

export function RulesScreen() {
  return (
    <div>
      <h1 className="text-4xl">Community rules</h1>
      <ul className="mt-4 grid gap-3">
        {COMMUNITY_RULES.map((rule) => (
          <li key={rule} className="rounded-3xl bg-card p-4 leading-7">{rule}</li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-6 text-muted">Automated checks can flag a post for a person to review. They are not a final decision.</p>
    </div>
  );
}

export function FrameworksScreen() {
  return (
    <div>
      <h1 className="text-4xl">Ideas in plain words</h1>
      <p className="mt-2 leading-7">These are teaching notes marked needs review. A prize or a famous name is not evidence that a financial claim is true. When a note says prize in economic sciences, that is not the Nobel Peace Prize.</p>
      <section className="mt-4 grid gap-3">
        <h2 className="text-2xl">These ideas do not all agree</h2>
        {IDEA_TENSIONS.map((line) => (
          <p key={line} className="rounded-3xl bg-card p-4 leading-7">{line}</p>
        ))}
      </section>
      <div className="mt-4 grid gap-3">
        {FRAMEWORKS.map((item) => (
          <article key={item.id} className="rounded-3xl border border-line bg-card p-4">
            <h2 className="text-2xl">{item.plainName}</h2>
            <p className="mt-2 leading-7">{item.streetExplanation}</p>
            <p className="mt-2 text-sm leading-6 text-muted">Textbook name, if you want it: {item.formalName}. {item.attributedTo}.</p>
            <p className="mt-2 text-sm leading-6">Where it fails: {item.whenItFails}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function SettingsScreen() {
  const app = useApp();
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  if (!app.ready) return <p role="status">Loading settings</p>;
  return (
    <div>
      <h1 className="text-4xl">Your data</h1>
      <p className="mt-2 leading-7">Export includes the local profile, attempts, and posts on this device. Delete clears that local copy. A live account deletion also requires the investing perps service role, which is not configured in demo mode.</p>
      <button
        type="button"
        className="btn-primary mt-4"
        onClick={() => {
          const blob = new Blob([JSON.stringify({ profile: app.profile, attempts: app.attempts, posts: app.posts.filter((post) => !post.sample), reports: app.reports }, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "investing-reps-learning-data.json";
          link.click();
          URL.revokeObjectURL(url);
          setMessage("Download started.");
        }}
      >
        Export learning data
      </button>
      <label className="mt-6 block text-sm font-semibold">
        Type DELETE to remove the local profile
        <input value={confirm} onChange={(event) => setConfirm(event.target.value)} className="mt-2 w-full min-h-11 rounded-2xl border border-line px-3" />
      </label>
      <button
        type="button"
        className="btn-quiet mt-3"
        disabled={confirm !== "DELETE"}
        onClick={() => {
          app.resetDemo();
          setMessage("Local demo data was deleted from this browser.");
          setConfirm("");
        }}
      >
        Delete local account data
      </button>
      {message ? <p className="mt-3 text-sm" role="status">{message}</p> : null}
    </div>
  );
}

export function ModerationScreen() {
  const app = useApp();
  const [reason, setReason] = useState("");
  const [target, setTarget] = useState(app.posts[0]?.id ?? "");
  if (!app.ready) return <p role="status">Loading the queue</p>;
  return (
    <div>
      <h1 className="text-4xl">Moderator queue</h1>
      <p className="mt-2 leading-7">You cannot grant yourself a moderator role. On the live investing perps project, moderator is an app_metadata role set outside this form. The control below records a sample removal on this device only.</p>
      <h2 className="mt-4 text-2xl">Your reports</h2>
      {app.reports.length === 0 ? <p className="mt-2 text-sm text-muted">No reports from this device.</p> : (
        <ul className="mt-2 grid gap-2 text-sm">
          {app.reports.map((report) => (
            <li key={report.id} className="rounded-2xl bg-card p-3">{report.targetType} {report.targetId}: {report.reason}</li>
          ))}
        </ul>
      )}
      <h2 className="mt-6 text-2xl">Sample removal</h2>
      <label className="mt-2 block text-sm font-semibold">
        Post
        <select value={target} onChange={(event) => setTarget(event.target.value)} className="mt-2 w-full min-h-11 rounded-2xl border border-line px-3">
          {app.posts.map((post) => <option key={post.id} value={post.id}>{post.title}</option>)}
        </select>
      </label>
      <label className="mt-3 block text-sm font-semibold">
        Reason
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 w-full rounded-2xl border border-line p-3" />
      </label>
      <button
        type="button"
        className="btn-primary mt-3"
        disabled={reason.trim().length < 5 || !target}
        onClick={() => app.removeWithReason({ targetType: "post", targetId: target, reason: reason.trim() })}
      >
        Record sample removal
      </button>
      <ul className="mt-4 grid gap-2 text-sm">
        {app.removals.map((removal) => (
          <li key={removal.id}>Removed {removal.targetId}. Reason: {removal.reason}. Sample, on this device.</li>
        ))}
      </ul>
    </div>
  );
}

const HIDDEN_FIELDS = new Set(["essay", "hook", "asOf"]);

function firstReading(fields: Record<string, string>): string {
  return Object.entries(fields).find(([key, value]) => value.trim() && !HIDDEN_FIELDS.has(key))?.[1] ?? "";
}

function readingBoxes(type: string, fields: Record<string, string>): [string, string][] {
  const prompts = type === "thesis" ? fieldPrompts("thesis") : type === "technique" ? fieldPrompts("technique") : [];
  const ordered = prompts
    .map(([key, label]) => [label, fields[key] ?? ""] as [string, string])
    .filter(([, value]) => value.trim().length > 0);
  if (ordered.length > 0) return ordered;
  return Object.entries(fields)
    .filter(([key, value]) => value.trim() && !HIDDEN_FIELDS.has(key))
    .map(([key, value]) => [key, value]);
}

export function LoginScreen() {
  return (
    <div>
      <h1 className="text-4xl">Account</h1>
      <p className="mt-2 leading-7">
        Live sign-in uses the Supabase project named investing perps. This session is in demo mode, so email and password are not sent anywhere. Use a local display name instead.
      </p>
      <Link href="/onboarding" className="btn-primary mt-4">Create a local profile</Link>
      <p className="mt-4 text-sm leading-6 text-muted">Publishing, comments, follows, and rankings on a shared board need that separate database. They are not connected to Favos.</p>
    </div>
  );
}
