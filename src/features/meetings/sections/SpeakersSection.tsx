import { useMemo, useState } from "react";
import type { WithId } from "@/hooks/_sub";
import type { MidItem as MidItemType, Speaker } from "@/lib/types";
import { reorderSpeakers } from "@/features/speakers/speakerActions";
import { ProgramSection } from "../program/ProgramSection";
import { MidPlaceholderRow, SpeakerListRow } from "./SpeakerListRow";

interface Props {
  wardId: string;
  date: string;
  speakers: readonly WithId<Speaker>[];
  mid: MidItemType | undefined;
}

function sortByOrder(speakers: readonly WithId<Speaker>[]): WithId<Speaker>[] {
  return [...speakers].sort((a, b) => {
    const oa = a.data.order ?? Number.MAX_SAFE_INTEGER;
    const ob = b.data.order ?? Number.MAX_SAFE_INTEGER;
    if (oa !== ob) return oa - ob;
    return a.id.localeCompare(b.id);
  });
}

function formatMidLabel(mid: MidItemType | undefined): string {
  if (!mid || mid.mode === "none") return "";
  if (mid.mode === "rest") {
    return mid.rest ? `Rest hymn · ${mid.rest.number} — ${mid.rest.title}` : "Rest hymn — pick a hymn";
  }
  return mid.musical?.performer
    ? `Musical number · ${mid.musical.performer}`
    : "Musical number — add performer";
}

export function SpeakersSection({ wardId, date, speakers, mid }: Props) {
  const ordered = useMemo(() => sortByOrder(speakers), [speakers]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  function persist(next: WithId<Speaker>[]) {
    void reorderSpeakers(wardId, date, next.map((s) => s.id));
  }

  function move(i: number, delta: number) {
    const j = i + delta;
    if (j < 0 || j >= ordered.length) return;
    const next = [...ordered];
    [next[i], next[j]] = [next[j]!, next[i]!];
    persist(next);
  }

  function handleDrop(i: number) {
    if (dragIdx == null || dragIdx === i) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    const next = [...ordered];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved!);
    persist(next);
    setDragIdx(null);
    setOverIdx(null);
  }

  const midLabel = formatMidLabel(mid);
  const showMidRow = Boolean(mid && mid.mode !== "none" && midLabel);
  const midAfter = Math.min(Math.max(mid?.midAfter ?? 1, 0), ordered.length);

  if (ordered.length === 0 && !showMidRow) {
    return (
      <ProgramSection id="sec-speakers" label="Speakers">
        <p className="font-serif italic text-[13.5px] text-walnut-3 py-1">
          No speakers yet. Assign from the schedule view.
        </p>
      </ProgramSection>
    );
  }

  return (
    <ProgramSection
      id="sec-speakers"
      label="Speakers"
      count={ordered.length}
      rightSlot={
        <span className="ml-auto inline-flex gap-2.5 items-center">
          <span className="font-serif italic text-[12.5px] text-walnut-3">Drag to reorder</span>
        </span>
      }
    >
      <ul className="flex flex-col">
        {ordered.map((s, i) => (
          <SpeakerListRow
            key={s.id}
            speaker={s}
            index={i}
            isLast={i === ordered.length - 1}
            isDragging={dragIdx === i}
            isOver={overIdx === i && dragIdx !== null && dragIdx !== i}
            onDragStart={() => setDragIdx(i)}
            onDragOver={() => setOverIdx(i)}
            onDragEnd={() => {
              setDragIdx(null);
              setOverIdx(null);
            }}
            onDrop={() => handleDrop(i)}
            onMoveUp={() => move(i, -1)}
            onMoveDown={() => move(i, +1)}
            midLabel={showMidRow && i + 1 === midAfter ? midLabel : null}
          />
        ))}
        {showMidRow && midAfter >= ordered.length && <MidPlaceholderRow label={midLabel} />}
      </ul>
    </ProgramSection>
  );
}
