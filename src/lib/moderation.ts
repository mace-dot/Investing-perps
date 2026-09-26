const GUARANTEE =
  /\b(guaranteed returns?|risk[- ]free profits?|can(?:not|'t) lose|double your money|sure thing)\b/i;
const ABUSE = /\b(idiot|moron|stupid (?:people|idiots)|kill yourself)\b/i;
const SPAM = /\b(dm me|telegram|whatsapp group|promo code|guaranteed signals?)\b/i;

export type ModerationFlag = {
  code: "guaranteed_return" | "personal_attack" | "possible_spam";
  message: string;
};

/** Flags are hints for a person to review. They are not a final judgment. */
export function flagContent(text: string): ModerationFlag[] {
  const flags: ModerationFlag[] = [];
  if (GUARANTEE.test(text)) {
    flags.push({
      code: "guaranteed_return",
      message: "This mentions a guaranteed or risk-free profit. A person should review it.",
    });
  }
  if (ABUSE.test(text)) {
    flags.push({
      code: "personal_attack",
      message: "This may attack a person rather than a claim. A person should review it.",
    });
  }
  if (SPAM.test(text)) {
    flags.push({
      code: "possible_spam",
      message: "This looks like promotion or a signal group. A person should review it.",
    });
  }
  return flags;
}
