import { useMemo, useState } from "react";
import type { WithId } from "@/hooks/_sub";
import type { MidItem as MidItemType, NonMeetingSunday, Speaker } from "@/lib/types";
import { reorderSpeakers } from "@/features/speakers/speakerActions";
import { ProgramSection } from "../program/ProgramSection";
import { updateMeetingField } from "../updateMeeting";
import { MidPlaceholderRow, SpeakerListRow } from "./SpeakerListRow";

interface Props {
  wardId: string;
  date: string;
  speakers: readonly WithId<Speaker>[];
  mid: MidItemType | undefined;
  nonMeetingSundays: readonly NonMeetingSunday[];
}

type Item =
  | { kind: "speaker"; id: string; speaker: WithId<Speaker> }
  | { kind: "mid"; id: "__mid__"; label: string };

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

function buildItems(ordered: WithId<Speaker>[], mid: MidItemType | undefined, midLabel: string): Item[] {
  const showMid = Boolean(mid && mid.mode !== "none" && midLabel);
  const clampedAfter = Math.min(Math.max(mid?.midAfter ?? 1, 0), ordered.length);
  const items: Item[] = [];
  ordered.forEach((s, i) => {
    if (showMid && i === clampedAfter) items.push({ kind: "mid", id: "__mid__", label: midLabel });
    items.push({ kind: "speaker", id: s.id, speaker: s });
  });
  if (showMid && clampedAfter >= ordered.length) {
    items.push({ kind: "mid", id: "__mid__", label: midLabel });
  }
  return items;
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
          No speakers yet. Assign from the schedule view.
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
        <span className="ml-auto inline-flex gap-2.5 items-center">
          <span className="font-serif italic text-[12.5px] text-walnut-3">Drag to reorder</span>
        </span>
      }
    >
      <ul className="flex flex-col">
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
              {...drag}
            />
          );
        })}
      </ul>
    </ProgramSection>
  );
}
