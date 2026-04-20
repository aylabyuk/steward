import { useSpeakers } from "@/hooks/useMeeting";
import type { MeetingType } from "@/lib/types";
import { SpeakerRow } from "./SpeakerRow";

interface Props {
  date: string;
  type: MeetingType;
  onAddSpeaker?: () => void;
}

export function SundayCardBody({ date, type, onAddSpeaker }: Props) {
  const { data: speakers } = useSpeakers(date);

  if (type === "fast") {
    return <p className="text-sm text-walnut-2 italic py-3">Testimony meeting — no speakers</p>;
  }

  return (
    <div>
      {speakers.length === 0 ? (
        <p className="text-sm text-walnut-2 italic py-3">No speakers yet.</p>
      ) : (
        <div className="space-y-3 py-3 border-b border-border mb-3 pb-3">
          {speakers.map((s, idx) => (
            <SpeakerRow key={s.id} number={idx + 1} speaker={s.data} />
          ))}
        </div>
      )}
      {onAddSpeaker && (
        <button
          onClick={onAddSpeaker}
          className="flex items-center gap-2 text-sm font-semibold text-bordeaux hover:text-bordeaux-deep transition-colors"
        >
          <span className="w-6 h-6 border border-bordeaux rounded-sm flex items-center justify-center text-lg">
            +
          </span>
          Add speaker
        </button>
      )}
    </div>
  );
}
