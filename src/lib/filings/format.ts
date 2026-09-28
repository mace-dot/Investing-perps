export function formatUsd(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const units: [number, string][] = [
    [1_000_000_000_000, "trillion"],
    [1_000_000_000, "billion"],
    [1_000_000, "million"],
  ];
  for (const [unit, name] of units) {
    if (abs >= unit) {
      const amount = abs / unit;
      const digits = amount >= 100 || Math.abs(amount - Math.round(amount)) < 0.05 ? 0 : 1;
      const rounded = amount.toFixed(digits).replace(/\.0$/, "");
      return `${sign}$${rounded} ${name}`;
    }
  }
  return `${sign}$${Math.round(abs).toLocaleString("en-US")}`;
}

export function formatPeriodEnd(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function describeChange(current: number, prior: number | null): string | null {
  if (prior === null) return null;
  if (prior === 0) return "the prior year was zero, so a percent change is not meaningful";
  const ratio = (current - prior) / Math.abs(prior);
  if (Math.abs(ratio) < 0.03) return `about flat versus ${formatUsd(prior)}`;
  const direction = ratio > 0 ? "up" : "down";
  return `${direction} ${Math.abs(ratio * 100).toFixed(0)} percent from ${formatUsd(prior)}`;
}
