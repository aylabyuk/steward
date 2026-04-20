import { useState } from "react";
import type { WithId } from "@/hooks/_sub";
import { useWardMembers } from "@/hooks/useWardMembers";
import type { Comment } from "@/lib/types";
import { useAuthStore } from "@/stores/authStore";
import { editComment, softDeleteComment } from "./commentActions";
import { extractMentions } from "./extractMentions";

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

function EditForm({
  draft,
  setDraft,
  onSave,
  onCancel,
  busy,
}: {
  draft: string;
  setDraft: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={busy || draft.trim().length === 0}
          className="rounded-md bg-slate-900 px-3 py-1 text-xs text-white disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function CommentBody({
  deleted,
  editing,
  body,
  editProps,
}: {
  deleted: boolean;
  editing: boolean;
  body: string;
  editProps: React.ComponentProps<typeof EditForm>;
}) {
  if (deleted) return <p className="italic text-slate-400">[deleted]</p>;
  if (editing) return <EditForm {...editProps} />;
  return <p className="whitespace-pre-wrap text-slate-900">{body}</p>;
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
    <li className="flex flex-col gap-1 rounded-md border border-slate-200 bg-white p-3 text-sm">
      <header className="flex items-baseline justify-between text-xs text-slate-500">
        <span className="font-medium text-slate-700">{comment.data.authorDisplayName}</span>
        <span>
          {formatWhen(comment.data.createdAt)}
          {edited && !deleted && " · edited"}
        </span>
      </header>
      <CommentBody
        deleted={deleted}
        editing={editing}
        body={comment.data.body}
        editProps={{
          draft,
          setDraft,
          onSave: () => void save(),
          onCancel: () => {
            setEditing(false);
            setDraft(comment.data.body);
          },
          busy,
        }}
      />
      {isAuthor && !deleted && !editing && (
        <div className="flex gap-3 text-xs">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-blue-600 hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => void remove()}
            disabled={busy}
            className="text-red-600 hover:underline disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      )}
    </li>
  );
}
