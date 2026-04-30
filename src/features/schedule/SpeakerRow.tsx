import { SpeakerChatLauncher } from "@/features/invitations/SpeakerChatLauncher";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import type { Speaker } from "@/lib/types";
import { StatusIndicator } from "./StatusIndicator";

interface Props {
  number: number;
  speaker: Speaker;
  /** Firestore doc id of the speaker — needed to look up their most
   *  recent invitation for the chat launcher. */
  speakerId: string;
  /** Meeting date (ISO YYYY-MM-DD). Scopes the invitation lookup. */
  date: string;
}

export function SpeakerRow({ number, speaker, speakerId, date }: Props) {
  const status = speaker.status ?? "planned";
  const wardId = useCurrentWardStore((s) => s.wardId) ?? "";
  return (
    <li className="flex items-center gap-3 h-16 border-b border-border last:border-b-0">
      <div className="font-mono text-[10.5px] tracking-[0.08em] text-brass-deep w-6 shrink-0">
        {String(number).padStart(2, "0")}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-sans text-sm font-semibold text-walnut truncate">{speaker.name}</div>
        {speaker.topic && (
          <div className="font-serif italic text-sm text-walnut-2 truncate">{speaker.topic}</div>
        )}
      </div>
      <StatusIndicator status={status} />
      <SpeakerChatLauncher wardId={wardId} date={date} speaker={speaker} speakerId={speakerId} />
    </li>
  );
}
