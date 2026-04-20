import type { Speaker } from "@/lib/types";
import type { WithId } from "@/hooks/_sub";
import { SpeakerRow } from "./SpeakerRow";

interface Props {
  speakers: WithId<Speaker>[];
  onAddSpeaker: () => void;
}

export function SundayCardBody({ speakers, onAddSpeaker }: Props) {
  return (
    <div className="px-4 pb-4">
      {speakers.length === 0 ? (
        <p className="font-serif italic text-sm text-walnut-3 py-2">No speakers yet.</p>
      ) : (
        <ul className="list-none m-0 p-0 mb-2">
          {speakers.map((s, idx) => (
            <SpeakerRow key={s.id} number={idx + 1} speaker={s.data} />
          ))}
        </ul>
      )}
      <button
        onClick={onAddSpeaker}
        className="inline-flex items-center gap-1.5 text-[13px] font-sans font-semibold text-bordeaux hover:text-bordeaux-deep transition-colors py-1.5"
      >
        <span className="w-4 h-4 border border-bordeaux rounded-sm flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
        </span>
        Add speaker
      </button>
    </div>
  );
}
