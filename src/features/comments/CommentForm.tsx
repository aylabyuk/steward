import { type KeyboardEvent, useRef, useState } from "react";
import { useWardMembers } from "@/hooks/useWardMembers";
import { useAuthStore } from "@/stores/authStore";
import type { WithId } from "@/hooks/_sub";
import type { Member } from "@/lib/types";
import { MentionSuggestList } from "./MentionSuggestList";
import { useMentionSuggest } from "./hooks/useMentionSuggest";
import { createComment } from "./utils/commentActions";
import { extractMentions } from "./utils/extractMentions";
import { applyMention } from "./utils/mentionToken";
import { renderCommentBody } from "./utils/renderCommentBody";

// Geometry shared between the textarea and the styled mirror behind
// it so the rendered chips line up character-for-character with what
// the user is typing. Any change here must touch both elements.
const TEXT_GEOMETRY = "font-sans text-[14px] leading-[1.55] px-3 py-2.5 rounded-md";

interface Props {
  wardId: string;
  date: string;
}

export function CommentForm({ wardId, date }: Props) {
  const user = useAuthStore((s) => s.user);
  const { data: members } = useWardMembers();
  const [body, setBody] = useState("");
  const [caret, setCaret] = useState(0);
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  const suggest = useMentionSuggest({ value: body, caret, members });

  function selectMember(m: WithId<Member>) {
    if (suggest.token === null) return;
    const next = applyMention(body, caret, suggest.token, m.data.displayName);
    setBody(next.value);
    // Defer to the next frame so React commits the new value before
    // we move the textarea selection — otherwise the browser's caret
    // snaps back to wherever React's controlled re-render landed.
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(next.caret, next.caret);
      setCaret(next.caret);
    });
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (!suggest.open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      suggest.setHighlight((h) => Math.min(suggest.matches.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      suggest.setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter" || e.key === "Tab") {
      const m = suggest.matches[suggest.highlight];
      if (m) {
        e.preventDefault();
        selectMember(m);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      suggest.dismiss();
    }
  }

  async function submit() {
    const trimmed = body.trim();
    if (!trimmed || !user) return;
    setBusy(true);
    try {
      await createComment({
        wardId,
        date,
        authorUid: user.uid,
        authorDisplayName: user.displayName ?? user.email ?? "Unknown",
        body: trimmed,
        mentionedUids: extractMentions(trimmed, members),
      });
      setBody("");
      setCaret(0);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="flex flex-col gap-2"
    >
      <div className="relative bg-parchment border border-transparent rounded-md transition-colors hover:border-border-strong hover:bg-chalk focus-within:border-bordeaux focus-within:bg-chalk focus-within:ring-2 focus-within:ring-bordeaux/15">
        {/* Styled mirror — sits behind the textarea and renders the
            same body with @Mention chips. Geometry classes match
            the textarea exactly so each character lands on the same
            pixel. The textarea on top carries `text-transparent` so
            only the caret + selection show through. */}
        <div
          ref={mirrorRef}
          aria-hidden
          className={`${TEXT_GEOMETRY} pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap wrap-break-word text-walnut`}
        >
          {renderCommentBody(body, members)}
          {/* Trailing newline-only bodies need a zero-width char so
              the mirror's last line takes height. */}
          {body.endsWith("\n") && "​"}
        </div>
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            setCaret(e.target.selectionStart);
          }}
          onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
          onKeyDown={onKeyDown}
          onScroll={(e) => {
            if (mirrorRef.current) {
              mirrorRef.current.scrollTop = e.currentTarget.scrollTop;
            }
          }}
          rows={3}
          placeholder="Leave a note for the bishopric. Use @Name to mention a ward member."
          className={`${TEXT_GEOMETRY} relative w-full min-h-17.5 resize-y bg-transparent border-0 text-transparent caret-walnut placeholder:text-walnut-3 placeholder:italic focus:outline-none`}
        />
        {suggest.open && (
          <MentionSuggestList
            matches={suggest.matches}
            highlight={suggest.highlight}
            onSelect={selectMember}
            onHover={(i) => suggest.setHighlight(i)}
          />
        )}
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={busy || body.trim().length === 0}
          className="font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment hover:bg-bordeaux-deep shadow-[0_1px_0_rgba(35,24,21,0.18)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {busy ? "Posting…" : "Post comment"}
        </button>
      </div>
    </form>
  );
}
