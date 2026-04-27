import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import type { WithId } from "@/hooks/_sub";
import { useWardMembers } from "@/hooks/useWardMembers";
import type { Comment } from "@/lib/types";
import { useAuthStore } from "@/stores/authStore";
import { editComment, softDeleteComment } from "./utils/commentActions";
import { extractMentions } from "./utils/extractMentions";

interface Props {
  wardId: string;
  date: string;
  comment: WithId<Comment>;
}

function formatWhen(raw: unknown): string {
  const maybe = raw as { toDate?: () => Date };
  const d = typeof maybe?.toDate === "function" ? maybe.toDate() : null;
  if (!d) return "";
  return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

export function CommentItem({ wardId, date, comment }: Props) {
  const user = useAuthStore((s) => s.user);
  const { data: members } = useWardMembers();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.data.body);
  const [busy, setBusy] = useState(false);

  const isAuthor = user?.uid === comment.data.authorUid;
  const deleted = Boolean(comment.data.deletedAt);
  const edited = Boolean(comment.data.editedAt);
  const authorMember = members.find((m) => m.id === comment.data.authorUid);
  const authorAvatar = {
    uid: comment.data.authorUid,
    displayName: authorMember?.data.displayName ?? comment.data.authorDisplayName,
    photoURL: authorMember?.data.photoURL ?? null,
  };

  async function save() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await editComment(wardId, date, comment.id, trimmed, extractMentions(trimmed, members));
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await softDeleteComment(wardId, date, comment.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-md border border-border bg-parchment px-3.5 py-2.5">
      <header className="flex items-center gap-2.5 mb-1.5">
        <Avatar user={authorAvatar} size="sm" />
        <span className="font-sans text-[13px] font-semibold text-walnut truncate flex-1 min-w-0">
          {comment.data.authorDisplayName}
          {isAuthor && <span className="text-walnut-3 font-normal"> (You)</span>}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-walnut-3 shrink-0">
          {formatWhen(comment.data.createdAt)}
          {edited && !deleted && " · edited"}
        </span>
      </header>

      {deleted ? (
        <p className="font-serif italic text-[13px] text-walnut-3">[deleted]</p>
      ) : editing ? (
        <EditForm
          draft={draft}
          setDraft={setDraft}
          onSave={() => void save()}
          onCancel={() => {
            setEditing(false);
            setDraft(comment.data.body);
          }}
          busy={busy}
        />
      ) : (
        <p className="whitespace-pre-wrap font-sans text-[13.5px] text-walnut leading-relaxed">
          {comment.data.body}
        </p>
      )}

      {isAuthor && !deleted && !editing && (
        <div className="flex gap-4 mt-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="font-sans text-[12px] font-semibold text-bordeaux hover:text-bordeaux-deep hover:underline hover:underline-offset-2 transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => void remove()}
            disabled={busy}
            className="font-sans text-[12px] font-semibold text-walnut-3 hover:text-bordeaux transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      )}
    </li>
  );
}

interface EditFormProps {
  draft: string;
  setDraft: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
}

function EditForm({ draft, setDraft, onSave, onCancel, busy }: EditFormProps) {
  return (
    <div className="flex flex-col gap-2 mt-1">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        className="font-sans text-[13.5px] leading-relaxed px-3 py-2 bg-chalk border border-border rounded-md text-walnut w-full resize-y transition-colors focus:outline-none focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/15"
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="font-sans text-[12.5px] font-semibold px-3 py-1.5 rounded-md border border-transparent text-walnut-2 hover:bg-parchment-2 hover:text-walnut transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={busy || draft.trim().length === 0}
          className="font-sans text-[12.5px] font-semibold px-3 py-1.5 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment hover:bg-bordeaux-deep shadow-[0_1px_0_rgba(35,24,21,0.18)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
