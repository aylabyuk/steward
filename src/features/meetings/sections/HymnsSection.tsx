import { HymnPicker } from "@/features/hymns/HymnPicker";
import type {
  Assignment,
  Hymn,
  MeetingType,
  MidItem as MidItemType,
  NonMeetingSunday,
  SacramentMeeting,
} from "@/lib/types";
import { AssignRow } from "../program/AssignRow";
import { MidItem } from "../program/MidItem";
import { ProgramSection } from "../program/ProgramSection";
import { updateMeetingField } from "../updateMeeting";

interface Props {
  wardId: string;
  date: string;
  meeting: SacramentMeeting | null;
  type: MeetingType;
  nonMeetingSundays: readonly NonMeetingSunday[];
}

// Suggested-hymn lists (opening/sacrament/closing).
const OPENING_SUGGESTIONS = [2, 9, 83, 301];
const SACRAMENT_SUGGESTIONS = [169, 174, 177, 181, 182, 188, 193, 194];
const CLOSING_SUGGESTIONS = [30, 85, 86, 89];

export function HymnsSection({ wardId, date, meeting, type, nonMeetingSundays }: Props) {
  const showSacramentHymn = type !== "stake" && type !== "general";

  async function setHymn(
    field: "openingHymn" | "sacramentHymn" | "closingHymn",
    next: Hymn | null,
  ) {
    await updateMeetingField(wardId, date, nonMeetingSundays, { [field]: next });
  }
  async function setMid(next: MidItemType) {
    await updateMeetingField(wardId, date, nonMeetingSundays, { mid: next });
  }
  async function setMusic(field: "chorister" | "pianist", next: Assignment) {
    await updateMeetingField(wardId, date, nonMeetingSundays, { [field]: next });
  }

  return (
    <ProgramSection id="sec-music" label="Music & hymns">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-7 gap-y-1 mb-4 pb-4 border-b border-dashed border-border">
        <AssignRow
          label="Chorister"
          placeholder="Chorister name"
          assignment={meeting?.chorister}
          onChange={(a) => void setMusic("chorister", a)}
        />
        <AssignRow
          label="Pianist"
          placeholder="Pianist name"
          assignment={meeting?.pianist}
          onChange={(a) => void setMusic("pianist", a)}
        />
      </div>
      <div className="flex flex-col">
        <HymnPicker
          label="Opening"
          hymn={meeting?.openingHymn}
          suggestions={OPENING_SUGGESTIONS}
          onChange={(h) => void setHymn("openingHymn", h)}
        />
        {showSacramentHymn && (
          <HymnPicker
            label="Sacrament"
            hymn={meeting?.sacramentHymn}
            suggestions={SACRAMENT_SUGGESTIONS}
            placeholder="Pick a sacrament hymn"
            onChange={(h) => void setHymn("sacramentHymn", h)}
          />
        )}
        <MidItem mid={meeting?.mid} onChange={(next) => void setMid(next)} />
        <HymnPicker
          label="Closing"
          hymn={meeting?.closingHymn}
          suggestions={CLOSING_SUGGESTIONS}
          placeholder="Pick a closing hymn"
          onChange={(h) => void setHymn("closingHymn", h)}
        />
      </div>
    </ProgramSection>
  );
}
