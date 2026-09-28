export function EssayPost({
  title,
  hook,
  essay,
  topic,
  kicker,
}: {
  title: string;
  hook: string;
  essay: string;
  topic: string;
  kicker: string;
}) {
  const paragraphs = essay
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  return (
    <div>
      <div className="flex min-h-72 flex-col justify-end rounded-3xl bg-ink p-6 text-white">
        <p className="text-sm font-semibold text-white/80">{kicker}</p>
        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-white/70">{topic}</p>
        <h2 className="mt-2 text-4xl leading-tight text-white">{title || "Untitled"}</h2>
        {hook ? <p className="mt-4 text-lg leading-8 text-white/90">{hook}</p> : null}
      </div>
      {paragraphs.length > 0 ? (
        <div className="mx-auto mt-6 max-w-prose">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="mt-4 font-serif text-lg leading-8">{paragraph}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
