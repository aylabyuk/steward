import { useMemo, useState } from "react";
import type { WithId } from "@/hooks/_sub";
import type { MidItem as MidItemType, NonMeetingSunday, Speaker } from "@/lib/types";
import { reorderSpeakers } from "@/features/speakers/utils/speakerActions";
import { ProgramSection } from "../program/ProgramSection";
import { updateMeetingField } from "../utils/updateMeeting";
import { MidPlaceholderRow, SpeakerListRow } from "./SpeakerListRow";
import { buildItems, formatMidLabel, sortByOrder, type Item } from "./utils/speakerListItems";

interface Props {
  wardId: string;
  date: string;
  speakers: readonly WithId<Speaker>[];
  mid: MidItemType | undefined;
  nonMeetingSundays: readonly NonMeetingSunday[];
}

export function SpeakersSection({ wardId, date, speakers, mid, nonMeetingSundays }: Props) {
  const ordered = useMemo(() => sortByOrder(speakers), [speakers]);
  const midLabel = formatMidLabel(mid);
  const items = useMemo(() => buildItems(ordered, mid, midLabel), [ordered, mid, midLabel]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  function persist(nextItems: Item[]) {
    const speakerIds = nextItems.filter((x) => x.kind === "speaker").map((x) => x.id);
    const midIdx = nextItems.findIndex((x) => x.kind === "mid");
    void reorderSpeakers(wardId, date, speakerIds);
    if (mid && midIdx >= 0) {
      void updateMeetingField(wardId, date, nonMeetingSundays, {
        mid: { ...mid, midAfter: midIdx },
      });
    }
  }

  function handleDrop(i: number) {
    if (dragIdx == null || dragIdx === i) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    const next = [...items];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved!);
    persist(next);
    setDragIdx(null);
    setOverIdx(null);
  }

  if (items.length === 0) {
    return (
      <ProgramSection id="sec-speakers" label="Speakers">
        <p className="font-serif italic text-[13.5px] text-walnut-3 py-1">
          No speakers yet. Add them from the schedule view.
        </p>
      </ProgramSection>
    );
  }

  let speakerCounter = 0;
  return (
    <ProgramSection
      id="sec-speakers"
      label="Speakers"
      count={ordered.length}
      rightSlot={
        <span className="ml-auto font-serif italic text-[12.5px] text-walnut-3">
          Drag to reorder
        </span>
      }
    >
      <ul className="flex flex-col -mx-5">
        {items.map((item, i) => {
          const drag = {
            isDragging: dragIdx === i,
            isOver: overIdx === i && dragIdx !== null && dragIdx !== i,
            onDragStart: () => setDragIdx(i),
            onDragOver: () => setOverIdx(i),
            onDragEnd: () => {
              setDragIdx(null);
              setOverIdx(null);
            },
            onDrop: () => handleDrop(i),
          };
          const isLast = i === items.length - 1;
          if (item.kind === "mid") {
            return <MidPlaceholderRow key={item.id} label={item.label} isLast={isLast} {...drag} />;
          }
          return (
            <SpeakerListRow
              key={item.id}
              speaker={item.speaker}
              index={speakerCounter++}
              isLast={isLast}
              wardId={wardId}
              date={date}
              {...drag}
            />
          );
        })}
      </ul>
    </ProgramSection>
  );
}
