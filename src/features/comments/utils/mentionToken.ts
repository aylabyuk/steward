/** Walks the comment body backwards from the caret to find an active
 *  `@token` — the partial display-name the user is currently typing.
 *  An active token must:
 *    - sit immediately to the left of the caret with no whitespace
 *      between the `@` and the caret,
 *    - have its `@` either at the start of the body or preceded by
 *      whitespace (so we don't trigger on email addresses).
 *
 *  Returns the substring after `@` (may be empty when the user just
 *  typed the `@`), or `null` when no active token exists.
 *
 *  Tokens are single-word — typing a space ends the token. The
 *  filtered display-name list still matches multi-word names via
 *  `includes()` in the suggest hook. */
export function activeMentionToken(value: string, caret: number): string | null {
  for (let i = caret - 1; i >= 0; i--) {
    const ch = value[i];
    if (ch === "@") {
      const beforeOk = i === 0 || /\s/.test(value[i - 1] ?? "");
      if (!beforeOk) return null;
      return value.slice(i + 1, caret);
    }
    if (ch === undefined || /\s/.test(ch)) return null;
  }
  return null;
}

/** Replaces the active `@token` immediately before `caret` with a
 *  full `@DisplayName ` (trailing space), returning the new body and
 *  caret position. The caller is responsible for syncing the
 *  textarea's selection range to the returned caret. */
export function applyMention(
  value: string,
  caret: number,
  token: string,
  displayName: string,
): { value: string; caret: number } {
  // Caret − 1 (= len(token)) − 1 (= the '@') puts us at the '@'.
  const atIndex = caret - token.length - 1;
  if (atIndex < 0 || value[atIndex] !== "@") return { value, caret };
  const before = value.slice(0, atIndex);
  const after = value.slice(caret);
  const inserted = `@${displayName} `;
  return { value: before + inserted + after, caret: before.length + inserted.length };
}
