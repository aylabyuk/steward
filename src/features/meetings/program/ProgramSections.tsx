import type { WithId } from "@/hooks/_sub";
import type { MeetingType, NonMeetingSunday, SacramentMeeting, Speaker } from "@/lib/types";
import { BusinessSection } from "../sections/BusinessSection";
import { HymnsSection } from "../sections/HymnsSection";
import { LeadersSection } from "../sections/LeadersSection";
import { PrayersSection } from "../sections/PrayersSection";
import { SacramentSection } from "../sections/SacramentSection";
import { SpeakersSection } from "../sections/SpeakersSection";

interface Props {
  wardId: string;
  date: string;
  meeting: SacramentMeeting | null;
  type: MeetingType;
  speakers: readonly WithId<Speaker>[];
  nonMeetingSundays: readonly NonMeetingSunday[];
}

export function ProgramSections({ wardId, date, meeting, type, speakers, nonMeetingSundays }: Props) {
  const sectionProps = { wardId, date, meeting, nonMeetingSundays };
  return (
    <>
      <LeadersSection {...sectionProps} />
      <BusinessSection {...sectionProps} />
      <PrayersSection {...sectionProps} />
      <SacramentSection {...sectionProps} />
      {type === "regular" && (
        <SpeakersSection
          wardId={wardId}
          date={date}
          speakers={speakers}
          mid={meeting?.mid}
          nonMeetingSundays={nonMeetingSundays}
        />
      )}
      <HymnsSection {...sectionProps} type={type} />
    </>
  );
}
