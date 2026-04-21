import type { WithId } from "@/hooks/_sub";
import type { Speaker } from "@/lib/types";
import { cn } from "@/lib/cn";

interface DragHandlers {
  isDragging: boolean;
  isOver: boolean;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
}

function useDragProps(d: DragHandlers) {
  return {
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = "move";
      d.onDragStart();
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      d.onDragOver();
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      d.onDrop();
    },
    onDragEnd: d.onDragEnd,
  };
}

function Grip() {
  return (
    <span
      aria-hidden
      className="text-[14px] text-walnut-3 opacity-40 group-hover/row:opacity-80 transition-opacity leading-none"
    >
      ⠿
    </span>
  );
}

interface SpeakerRowProps extends DragHandlers {
  speaker: WithId<Speaker>;
  index: number;
  isLast: boolean;
}

export function SpeakerListRow({ speaker: s, index, isLast, ...drag }: SpeakerRowProps) {
  return (
    <li
      {...useDragProps(drag)}
      className={cn(
        "group/row grid grid-cols-[28px_minmax(0,1fr)_auto] gap-3 items-center py-2.5 px-5 border-b border-dashed border-border cursor-grab transition-colors hover:bg-parchment",
        isLast && "border-b-0",
        drag.isDragging && "opacity-40",
        drag.isOver &&
          "bg-brass-soft/30 shadow-[inset_0_-2px_0_var(--color-bordeaux-deep),inset_0_2px_0_var(--color-bordeaux-deep)]",
      )}
    >
      <span className="font-mono text-[10.5px] tracking-[0.08em] text-brass-deep">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <div className="font-sans text-[14.5px] font-semibold text-walnut leading-tight truncate">
          {s.data.name}
        </div>
        <div className="font-serif italic text-[13px] text-walnut-2 mt-0.5 truncate">
          {s.data.topic || <span className="text-walnut-3 not-italic">No topic assigned</span>}
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <StatusPill status={s.data.status} />
        <Grip />
      </div>
    </li>
  );
}

interface MidRowProps extends DragHandlers {
  label: string;
  isLast: boolean;
}

export function MidPlaceholderRow({ label, isLast, ...drag }: MidRowProps) {
  return (
    <li
      {...useDragProps(drag)}
      aria-label="Musical interlude"
      className={cn(
        "group/row grid grid-cols-[28px_minmax(0,1fr)_auto] gap-3 items-center py-2.5 px-5 border-y border-dashed border-brass-soft bg-[linear-gradient(180deg,rgba(224,190,135,0.18),rgba(224,190,135,0.05))] cursor-grab transition-colors",
        isLast && "border-b-0",
        drag.isDragging && "opacity-40",
        drag.isOver &&
          "bg-brass-soft/60 shadow-[inset_0_-2px_0_var(--color-bordeaux-deep),inset_0_2px_0_var(--color-bordeaux-deep)]",
      )}
    >
      <span className="font-serif text-[18px] text-bordeaux leading-none">♪</span>
      <div className="min-w-0">
        <div className="font-serif italic font-medium text-[14px] text-bordeaux-deep truncate">
          {label}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-walnut-3 mt-0.5">
          Musical interlude
        </div>
      </div>
      <div className="flex items-center">
        <Grip />
      </div>
    </li>
  );
}

function StatusPill({ status }: { status: Speaker["status"] }) {
  const s = status ?? "planned";
  return (
    <span
      className={cn(
        "font-mono text-[9.5px] uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border whitespace-nowrap",
        s === "confirmed" && "text-success border-success-soft bg-success-soft",
        s === "invited" && "text-brass-deep border-brass-soft bg-[rgba(224,190,135,0.25)]",
        s === "declined" && "text-bordeaux border-danger-soft bg-danger-soft",
        s === "planned" && "text-walnut-2 border-border bg-parchment",
      )}
    >
      {s}
    </span>
  );
}
