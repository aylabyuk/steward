import type { WithId } from "@/hooks/_sub";
import { useComments } from "@/hooks/useComments";
import type { Comment } from "@/lib/types";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";

interface Props {
  wardId: string;
  date: string;
}

function ThreadBody({
  loading,
  comments,
  wardId,
  date,
}: {
  loading: boolean;
  comments: WithId<Comment>[];
  wardId: string;
  date: string;
}) {
  if (loading) return <p className="text-xs text-slate-500">Loading…</p>;
  if (comments.length === 0) return <p className="text-xs text-slate-500">No comments yet.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {comments.map((c) => (
        <CommentItem key={c.id} wardId={wardId} date={date} comment={c} />
      ))}
    </ul>
  );
}

export function CommentThread({ wardId, date }: Props) {
  const { data: comments, loading, error } = useComments(date);
  const visibleCount = comments.filter((c) => !c.data.deletedAt).length;

  return (
    <details className="rounded-lg border border-slate-200 bg-slate-50 p-4" open>
      <summary className="cursor-pointer text-sm font-semibold text-slate-700">
        Comments ({visibleCount})
      </summary>
      {error && (
        <p className="mt-3 text-xs text-red-700">Failed to load comments: {error.message}</p>
      )}
      <div className="mt-3 flex flex-col gap-3">
        <ThreadBody loading={loading} comments={comments} wardId={wardId} date={date} />
        <CommentForm wardId={wardId} date={date} />
      </div>
    </details>
  );
}
