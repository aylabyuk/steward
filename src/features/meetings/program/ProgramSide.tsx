import { CommentThread } from "@/features/comments/CommentThread";
import { ProgramRail, type RailSection } from "./ProgramRail";
import { StatusLegend } from "./StatusLegend";

interface Props {
  wardId: string;
  date: string;
  rail: readonly RailSection[];
}

/**
 * Desktop right column: sticky rail + legend + comments. On mobile
 * (<lg) this block collapses to a single column at the bottom of the
 * page content.
 */
export function ProgramSide({ wardId, date, rail }: Props) {
  return (
    <div className="flex flex-col gap-4 min-w-0 lg:sticky lg:top-22.5 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pb-4">
      <ProgramRail sections={rail} />
      <div className="hidden lg:flex">
        <StatusLegend />
      </div>
      <CommentThread wardId={wardId} date={date} />
    </div>
  );
}
