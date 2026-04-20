const PLACEHOLDER = /\{\{(\w+)\}\}/g;

export type TemplateValues = Readonly<Record<string, string | number | undefined>>;

/**
 * Replaces `{{placeholder}}` tokens with supplied values. Unknown or empty
 * placeholders stay intact so typos + missing data are visible in the output.
 */
export function renderTemplate(template: string, values: TemplateValues): string {
  return template.replace(PLACEHOLDER, (match, key) => {
    const v = values[key];
    if (v === undefined || v === "" || v === null) return match;
    return String(v);
  });
}
