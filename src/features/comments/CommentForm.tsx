import { useState } from "react";
import { useWardMembers } from "@/hooks/useWardMembers";
import { useAuthStore } from "@/stores/authStore";
import { createComment } from "./commentActions";
import { extractMentions } from "./extractMentions";

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
        placeholder="Leave a comment. Use @Name to mention a ward member."
        className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={busy || body.trim().length === 0}
          className="rounded-md bg-slate-900 px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          {busy ? "Posting…" : "Post comment"}
        </button>
      </div>
    </form>
  );
}
