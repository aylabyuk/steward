import { useSpeakers } from "@/hooks/useMeeting";
import type { MeetingType } from "@/lib/types";
import { SpeakerRow } from "./SpeakerRow";

interface Props {
  date: string;
  type: MeetingType;
}

export function SundayCardBody({ date, type }: Props) {
  const { data: speakers } = useSpeakers(date);

  if (type === "fast") {
    return <p className="text-sm text-walnut-2 italic py-3">Testimony meeting — no speakers</p>;
  }

  if (speakers.length === 0) {
    return <p className="text-sm text-walnut-2 py-3">No speakers yet</p>;
  }

  return (
    <div className="space-y-1 py-2">
      {speakers.map((s, idx) => (
        <SpeakerRow key={s.id} number={idx + 1} speaker={s.data} />
      ))}
    </div>
  );
}
