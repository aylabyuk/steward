import { HymnPicker } from "@/features/hymns/HymnPicker";
import type { Hymn, MeetingType, NonMeetingSunday, SacramentMeeting } from "@/lib/types";
import { updateMeetingField } from "../updateMeeting";

interface Props {
  wardId: string;
  date: string;
  meeting: SacramentMeeting | null;
  type: MeetingType;
  nonMeetingSundays: readonly NonMeetingSunday[];
}

export function HymnsSection({ wardId, date, meeting, type, nonMeetingSundays }: Props) {
  const showSacramentHymn = type !== "stake" && type !== "general";

  async function set(field: "openingHymn" | "sacramentHymn" | "closingHymn", next: Hymn | null) {
    await updateMeetingField(wardId, date, nonMeetingSundays, { [field]: next });
  }

  return (
    <div className="flex flex-col gap-3">
      <HymnPicker
        label="Opening"
        hymn={meeting?.openingHymn}
        onChange={(h) => void set("openingHymn", h)}
      />
      {showSacramentHymn && (
        <HymnPicker
          label="Sacrament"
          hymn={meeting?.sacramentHymn}
          onChange={(h) => void set("sacramentHymn", h)}
        />
      )}
      <HymnPicker
        label="Closing"
        hymn={meeting?.closingHymn}
        onChange={(h) => void set("closingHymn", h)}
      />
    </div>
  );
}
