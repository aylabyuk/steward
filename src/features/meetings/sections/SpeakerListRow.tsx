import type { WithId } from "@/hooks/_sub";
import type { Speaker } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  speaker: WithId<Speaker>;
  index: number;
  isLast: boolean;
  isDragging: boolean;
  isOver: boolean;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  midLabel: string | null;
}

export function SpeakerListRow({
  speaker: s,
  index,
  isLast,
  isDragging,
  isOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onMoveUp,
  onMoveDown,
  midLabel,
}: Props) {
  return (
    <>
      <li
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          onDragStart();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver();
        }}
        onDrop={(e) => {
          e.preventDefault();
          onDrop();
        }}
        onDragEnd={onDragEnd}
        className={cn(
          "grid grid-cols-[44px_minmax(0,1fr)_auto_64px] gap-3 items-center py-2.5 border-b border-dashed border-border rounded cursor-grab transition-colors",
          isLast && !midLabel && "border-b-0",
          isDragging && "opacity-40",
          isOver && "bg-brass-soft/30 shadow-[inset_0_-2px_0_var(--color-bordeaux-deep),inset_0_2px_0_var(--color-bordeaux-deep)]",
          "hover:bg-parchment",
        )}
      >
        <div className="inline-flex items-center gap-1 text-walnut-3">
          <span className="font-mono text-[10.5px] tracking-[0.08em] text-brass-deep">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-[14px] opacity-50" aria-hidden>⠿</span>
        </div>
        <div className="min-w-0">
          <div className="font-sans text-[14.5px] font-semibold text-walnut leading-tight truncate">
            {s.data.name}
          </div>
          <div className="font-serif italic text-[13px] text-walnut-2 mt-0.5 truncate">
            {s.data.topic || (
              <span className="text-walnut-3 not-italic">No topic assigned</span>
            )}
          </div>
        </div>
        <StatusPill status={s.data.status} />
        <div className="inline-flex gap-0.5">
          <OrderBtn onClick={onMoveUp} disabled={index === 0} label="Move up">▲</OrderBtn>
          <OrderBtn onClick={onMoveDown} disabled={false} label="Move down">▼</OrderBtn>
        </div>
      </li>
      {midLabel && <MidPlaceholderRow label={midLabel} />}
    </>
  );
}

export function MidPlaceholderRow({ label }: { label: string }) {
  return (
    <li
      className="grid grid-cols-[44px_minmax(0,1fr)] gap-3 items-center py-2.5 px-1 border-y border-dashed border-brass-soft bg-[linear-gradient(180deg,rgba(224,190,135,0.18),rgba(224,190,135,0.05))]"
      aria-label="Musical interlude"
    >
      <div className="font-serif text-[18px] text-bordeaux text-center">♪</div>
      <div className="min-w-0">
        <div className="font-serif italic font-medium text-[14px] text-bordeaux-deep truncate">
          {label}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-walnut-3 mt-0.5">
          Musical interlude
        </div>
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

function OrderBtn({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="w-6 h-5.5 inline-flex items-center justify-center bg-parchment border border-border rounded text-[9px] text-walnut-2 transition-colors hover:border-walnut-3 hover:text-bordeaux hover:bg-chalk disabled:opacity-35 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
