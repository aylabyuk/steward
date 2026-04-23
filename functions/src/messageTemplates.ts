import type { MessageTemplateKey } from "./messageTemplateDefaults.js";
import { DEFAULT_MESSAGE_TEMPLATES } from "./messageTemplateDefaults.js";

/**
 * Replace `{{name}}` tokens in `template` with values from `vars`.
 * Unknown keys stay literal (mirrors the client helper at
 * `src/features/templates/interpolate.ts`) so authoring typos are
 * visible in the delivered message rather than silently dropped.
 * Whitespace inside the braces is tolerated.
 */
export function interpolate(template: string, vars: Readonly<Record<string, string>>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) =>
    Object.hasOwn(vars, key) ? vars[key]! : match,
  );
}

/**
 * Fetches the body of a ward's server-side messaging template from
 * Firestore. Falls back to the hardcoded default when no doc has
 * been written yet (or when the doc is malformed). Never throws —
 * downstream sends should always succeed even when the template
 * collection is empty.
 */
export async function readMessageTemplate(
  db: FirebaseFirestore.Firestore,
  wardId: string,
  key: MessageTemplateKey,
): Promise<string> {
  const fallback = DEFAULT_MESSAGE_TEMPLATES[key];
  try {
    const snap = await db.doc(`wards/${wardId}/templates/${key}`).get();
    if (!snap.exists) return fallback;
    const body = snap.get("bodyMarkdown");
    return typeof body === "string" && body.length > 0 ? body : fallback;
  } catch {
    return fallback;
  }
}
