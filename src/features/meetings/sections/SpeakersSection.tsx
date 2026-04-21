import { useMemo, useRef, useState } from "react";
import type { WithId } from "@/hooks/_sub";
import type { MidItem as MidItemType, NonMeetingSunday, Speaker } from "@/lib/types";
import { reorderSpeakers } from "@/features/speakers/speakerActions";
import { AssignDialog } from "@/features/schedule/AssignDialog";
import { SpeakerEditList, type SpeakerEditListHandle } from "@/features/schedule/SpeakerEditList";
import { formatShortDate } from "@/features/schedule/dateFormat";
import { ProgramSection } from "../program/ProgramSection";
import { updateMeetingField } from "../updateMeeting";
import { MidPlaceholderRow, SpeakerListRow } from "./SpeakerListRow";
import { buildItems, formatMidLabel, sortByOrder, type Item } from "./speakerListItems";

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
  const [manageOpen, setManageOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const editListRef = useRef<SpeakerEditListHandle>(null);

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

  async function handleManageSave() {
    if (!editListRef.current) return;
    setSaving(true);
    try {
      await editListRef.current.save();
      setManageOpen(false);
    } finally {
      setSaving(false);
    }
  }

  const manageButton = (
    <button
      type="button"
      onClick={() => setManageOpen(true)}
      className="ml-auto font-sans text-[12.5px] font-semibold text-bordeaux hover:text-bordeaux-deep hover:underline hover:underline-offset-2 transition-colors"
    >
      Manage speakers →
    </button>
  );

  const dialog = (
    <AssignDialog
      open={manageOpen}
      title={formatShortDate(date)}
      saving={saving}
      onClose={() => setManageOpen(false)}
      onSave={() => void handleManageSave()}
    >
      <SpeakerEditList
        ref={editListRef}
        date={date}
        wardId={wardId}
        nonMeetingSundays={nonMeetingSundays}
      />
    </AssignDialog>
  );

  if (items.length === 0) {
    return (
      <ProgramSection id="sec-speakers" label="Speakers" rightSlot={manageButton}>
        <p className="font-serif italic text-[13.5px] text-walnut-3 py-1">
          No speakers yet. Use <em>Manage speakers</em> to add them.
        </p>
        {dialog}
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
        <span className="ml-auto inline-flex gap-3 items-center">
          <span className="font-serif italic text-[12.5px] text-walnut-3">Drag to reorder</span>
          {manageButton}
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
              {...drag}
            />
          );
        })}
      </ul>
      {dialog}
    </ProgramSection>
  );
}
