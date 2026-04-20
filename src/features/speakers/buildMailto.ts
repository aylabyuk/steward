const MAX_URL_LENGTH = 1800;
const TRUNCATION_MARKER = "\n\n[truncated]";

export interface MailtoInput {
  to: string;
  cc: readonly string[];
  subject: string;
  body: string;
}

function buildUrl(to: string, cc: string[], subject: string, body: string): string {
  const params: string[] = [];
  if (cc.length > 0) params.push(`cc=${cc.map(encodeURIComponent).join(",")}`);
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  params.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${encodeURIComponent(to)}?${params.join("&")}`;
}

/**
 * Builds a `mailto:` URL per RFC 2368 with percent-encoded params.
 * Dedupes CC and folds to lowercase. If the total URL exceeds roughly
 * the ~2000 char mailto cap, the body is trimmed (with a marker) so
 * the link still opens in the mail client.
 */
export function buildMailto({ to, cc, subject, body }: MailtoInput): string {
  const dedupedCc = [
    ...new Set(cc.map((e) => e.trim().toLowerCase()).filter((e) => e.length > 0)),
  ];
  const initial = buildUrl(to, dedupedCc, subject, body);
  if (initial.length <= MAX_URL_LENGTH) return initial;

  // Binary-search the longest body that, once encoded, fits under the cap.
  let lo = 0;
  let hi = body.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    const candidate = body.slice(0, mid) + TRUNCATION_MARKER;
    if (buildUrl(to, dedupedCc, subject, candidate).length <= MAX_URL_LENGTH) lo = mid;
    else hi = mid - 1;
  }
  return buildUrl(to, dedupedCc, subject, body.slice(0, lo) + TRUNCATION_MARKER);
}
