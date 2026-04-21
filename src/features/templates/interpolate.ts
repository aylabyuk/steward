/**
 * Replace `{{varName}}` tokens in a string with values from `vars`.
 * Unknown variables are left as-is (e.g. `{{unknown}}` stays literally
 * in the output) — this makes missing values visible during authoring
 * rather than silently vanishing.
 *
 * Whitespace inside the braces is tolerated: `{{ name }}` and
 * `{{name}}` both match the key `name`.
 */
export function interpolate(template: string, vars: Readonly<Record<string, string>>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) =>
    Object.hasOwn(vars, key) ? vars[key]! : match,
  );
}

/**
 * Variable set resolved for a single speaker letter render. Keeping
 * this typed (rather than a bag of strings) means the callsite catches
 * missing variables at compile time.
 */
export interface SpeakerLetterVars {
  speakerName: string;
  topic: string;
  date: string; // Pre-formatted, e.g. "Sunday, April 26, 2026"
  wardName: string;
  inviterName: string;
  today: string; // Pre-formatted, e.g. "April 21, 2026"
}

export function renderSpeakerLetterVars(vars: SpeakerLetterVars): Record<string, string> {
  return { ...vars };
}
