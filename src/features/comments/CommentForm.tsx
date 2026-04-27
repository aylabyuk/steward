import { useState } from "react";
import { useWardMembers } from "@/hooks/useWardMembers";
import { useAuthStore } from "@/stores/authStore";
import { createComment } from "./utils/commentActions";
import { extractMentions } from "./utils/extractMentions";

interface Props {
  wardId: string;
  date: string;
}

export function CommentForm({ wardId, date }: Props) {
  const user = useAuthStore((s) => s.user);
  const { data: members } = useWardMembers();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

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
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Leave a note for the bishopric. Use @Name to mention a ward member."
        className="font-sans text-[14px] leading-[1.55] px-3 py-2.5 bg-parchment border border-transparent rounded-md text-walnut min-h-17.5 w-full resize-y transition-colors placeholder:text-walnut-3 placeholder:italic hover:border-border-strong hover:bg-chalk focus:outline-none focus:border-bordeaux focus:bg-chalk focus:ring-2 focus:ring-bordeaux/15"
      />
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
