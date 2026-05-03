import { useEffect, useMemo, useState } from "react";
import type { WithId } from "@/hooks/_sub";
import type { Member } from "@/lib/types";
import { activeMentionToken } from "../utils/mentionToken";

const MAX_MATCHES = 6;

interface Args {
  value: string;
  caret: number;
  members: readonly WithId<Member>[];
}

interface Result {
  /** True when the popover should render — there's an active token
   *  AND filtered matches AND the user hasn't dismissed the current
   *  token via Escape. */
  open: boolean;
  /** The active partial token (`""` when the user just typed `@`),
   *  or `null` when no token is active. Returned for `applyMention`. */
  token: string | null;
  matches: readonly WithId<Member>[];
  highlight: number;
  setHighlight: (next: number | ((prev: number) => number)) => void;
  /** Suppress the popover for the current token until a fresh `@` is
   *  typed. Wired to Escape in the form. */
  dismiss: () => void;
}

/** Drives the @-mention autosuggest in `CommentForm`. Pure state —
 *  the caller threads `value` + `caret` from the textarea. Members
 *  filter case-insensitively against displayName via `includes`, so
 *  typing `@yeng` matches "Sister Yeng Const". */
export function useMentionSuggest({ value, caret, members }: Args): Result {
  const token = activeMentionToken(value, caret);
  const matches = useMemo<readonly WithId<Member>[]>(() => {
    if (token === null) return [];
    const q = token.trim().toLowerCase();
    return members
      .filter((m) => m.data.active)
      .filter((m) => (q ? m.data.displayName.toLowerCase().includes(q) : true))
      .slice(0, MAX_MATCHES);
  }, [members, token]);

  const [highlight, setHighlight] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Reset highlight + dismissed flag whenever the active token
  // changes (or disappears) — typing `@a` then `@b` should re-open
  // the popover, and the highlight should land on the first match.
  useEffect(() => {
    setHighlight(0);
    if (token === null) setDismissed(false);
  }, [token]);

  return {
    open: !dismissed && matches.length > 0,
    token,
    matches,
    highlight,
    setHighlight,
    dismiss: () => setDismissed(true),
  };
}
