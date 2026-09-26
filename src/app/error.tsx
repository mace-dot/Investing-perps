"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="rounded-3xl bg-card p-5">
      <h1 className="text-3xl">This screen hit a problem.</h1>
      <p className="mt-2 leading-7">Your demo notes are still in this browser if they were saved. Try the screen again.</p>
      <button type="button" className="btn-primary mt-4" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
