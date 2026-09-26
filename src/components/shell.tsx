"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LESSONS } from "@/lib/curriculum/public-lessons";
import { TOPICS } from "@/lib/curriculum/types";
import { lessonProgress, useApp } from "./app-state";

const NAV = [
  { href: "/", label: "Feed" },
  { href: "/practice", label: "Practice" },
  { href: "/create", label: "Create" },
  { href: "/rankings", label: "Rankings" },
  { href: "/profile", label: "Profile" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const app = useApp();
  const interests = app.profile?.interests ?? [];
  const next = LESSONS.find((lesson) => !lessonProgress(app.attempts, lesson.id).done) ?? LESSONS[0];

  return (
    <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,640px)_280px]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-card focus:px-4 focus:py-2">
        Skip to content
      </a>
      <aside className="hidden border-r border-line px-4 py-6 lg:block">
        <Link href="/" className="block px-2">
          <p className="font-serif text-2xl text-ink">Investing Reps</p>
          <p className="mt-1 text-sm text-muted">Learn a technique. Test your judgment.</p>
        </Link>
        <nav aria-label="Primary" className="mt-8 grid gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={`min-h-11 rounded-2xl px-3 py-2 text-base ${pathname === item.href ? "bg-teal text-white" : "hover:bg-card"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 grid gap-2 px-3 text-sm">
          <Link href="/frameworks" className="min-h-11 py-2">Ideas in plain words</Link>
          <Link href="/rules" className="min-h-11 py-2">Community rules</Link>
          <Link href="/login" className="min-h-11 py-2">Sign in</Link>
          <Link href="/moderation" className="min-h-11 py-2">Moderation</Link>
        </div>
      </aside>
      <div className="min-w-0">
        {app.mode === "demo" ? (
          <p className="border-b border-line bg-card px-4 py-3 text-sm leading-6 text-ink">
            Demo mode. Sample lessons are marked needs review. Actions stay on this device and are not saved to Supabase.
          </p>
        ) : null}
        {app.notice ? (
          <p className="mx-4 mt-4 rounded-2xl border border-line bg-card px-4 py-3 text-sm leading-6" role="status">
            {app.notice}{" "}
            <button type="button" className="min-h-11 underline" onClick={app.clearNotice}>
              Dismiss
            </button>
          </p>
        ) : null}
        <main id="main" className="min-w-0 px-4 pb-28 pt-4 lg:pb-10">
          <div className="mb-4 flex flex-wrap gap-3 text-sm lg:hidden">
            <Link href="/frameworks" className="min-h-11 py-2 font-semibold text-teal">Ideas</Link>
            <Link href="/rules" className="min-h-11 py-2 font-semibold text-teal">Rules</Link>
            <Link href="/login" className="min-h-11 py-2 font-semibold text-teal">Sign in</Link>
            <Link href="/settings" className="min-h-11 py-2 font-semibold text-teal">Data</Link>
          </div>
          {children}
        </main>
      </div>
      <aside className="hidden px-4 py-6 xl:block">
        <section className="rounded-3xl border border-line bg-card p-4 shadow-sm">
          <h2 className="text-xl">Learning goals</h2>
          {interests.length === 0 ? (
            <p className="mt-2 text-sm leading-6 text-muted">
              Pick up to three topics when you are ready. You can start the first lesson without an account.
            </p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {interests.map((id) => (
                <li key={id} className="rounded-2xl bg-paper px-3 py-2 text-sm">
                  {TOPICS.find((topic) => topic.id === id)?.plain ?? id}
                </li>
              ))}
            </ul>
          )}
          <Link href="/onboarding" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-teal">
            {app.profile ? "Edit interests" : "Set interests"}
          </Link>
        </section>
        <section className="mt-4 rounded-3xl border border-line bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-plum">Weekly challenge</p>
          <h2 className="mt-1 text-xl">Not on the public board yet</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            The sample set uses lessons still marked needs review. Practice is open. Ranking points stay off until an editor approves the curriculum in the investing perps project.
          </p>
          {next ? (
            <Link href={`/practice/${next.id}`} className="mt-3 inline-flex min-h-11 items-center rounded-full bg-teal px-4 text-sm font-semibold text-white">
              Continue: {next.streetTitle}
            </Link>
          ) : null}
        </section>
      </aside>
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-card px-1 py-1 lg:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center rounded-2xl text-center text-xs font-semibold ${pathname === item.href ? "bg-teal text-white" : "text-ink"}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
