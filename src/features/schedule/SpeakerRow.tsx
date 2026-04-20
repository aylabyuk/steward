import type { Speaker } from "@/lib/types";
import { StatePill } from "./StatePill";

interface Props {
  number: number;
  speaker: Speaker;
}

export function SpeakerRow({ number, speaker }: Props) {
  return (
    <div className="flex items-center gap-3 py-2 text-sm">
      <span className="font-semibold text-walnut-2 w-5 text-right">{number}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-walnut">{speaker.name}</div>
        {speaker.topic && <div className="italic text-walnut-2 text-xs">{speaker.topic}</div>}
      </div>
      <StatePill status={speaker.status} size="sm" />
    </div>
  );
}
