import { useComments } from "@/hooks/useComments";
import { ProgramSection } from "@/features/meetings/program/ProgramSection";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";

interface Props {
  wardId: string;
  date: string;
}

export function CommentThread({ wardId, date }: Props) {
  const { data: comments, loading, error } = useComments(date);
  const visible = comments.filter((c) => !c.data.deletedAt);

  return (
    <ProgramSection id="sec-comments" label="Comments" count={visible.length}>
      {error && (
        <p className="font-serif italic text-[13px] text-bordeaux mb-3">
          Failed to load comments — {error.message}
        </p>
      )}

      {loading ? (
        <p className="font-serif italic text-[13px] text-walnut-3 py-1">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="font-serif italic text-[13px] text-walnut-3 py-1">No comments yet.</p>
      ) : (
        <ul className="flex flex-col gap-2.5 mb-4 list-none m-0 p-0">
          {comments.map((c) => (
            <CommentItem key={c.id} wardId={wardId} date={date} comment={c} />
          ))}
        </ul>
      )}

      <div className={visible.length > 0 ? "pt-3 border-t border-dashed border-border" : ""}>
        <CommentForm wardId={wardId} date={date} />
      </div>
    </ProgramSection>
  );
}
