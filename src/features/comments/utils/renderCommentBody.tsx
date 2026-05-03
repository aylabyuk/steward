import type { ReactNode } from "react";
import type { WithId } from "@/hooks/_sub";
import type { Member } from "@/lib/types";

function escapeRegex(s: string): string {
  return s.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

/** Turns a comment body into a sequence of plain-text segments and
 *  styled `@Mention` spans by scanning for any active ward member's
 *  displayName preceded by `@` and bounded on the right by
 *  whitespace, sentence punctuation, or end-of-string. Mirrors
 *  `extractMentions`'s match rules so the visual highlight stays in
 *  lockstep with the notification fan-out. Names are tried longest
 *  first so e.g. `@Alice Smith` wins over `@Alice`. */
export function renderCommentBody(body: string, members: readonly WithId<Member>[]): ReactNode[] {
  const names = members
    .filter((m) => m.data.active)
    .map((m) => m.data.displayName.trim())
    .filter((n) => n.length > 0)
    .toSorted((a, b) => b.length - a.length);

  if (names.length === 0 || body.length === 0) return [body];

  const alternation = names.map(escapeRegex).join("|");
  const pattern = new RegExp(`@(${alternation})(?=[\\s.,!?;:]|$)`, "giu");

  const out: ReactNode[] = [];
  let cursor = 0;
  let key = 0;
  for (const match of body.matchAll(pattern)) {
    const start = match.index;
    if (start > cursor) out.push(body.slice(cursor, start));
    out.push(
      <span
        key={`m-${key++}`}
        className="font-semibold text-bordeaux-deep bg-bordeaux/8 rounded-sm px-0.5"
      >
        {match[0]}
      </span>,
    );
    cursor = start + match[0].length;
  }
  if (cursor < body.length) out.push(body.slice(cursor));
  return out;
}
