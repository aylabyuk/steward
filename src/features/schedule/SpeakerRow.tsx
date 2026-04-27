import { SpeakerChatLauncher } from "@/features/invitations/SpeakerChatLauncher";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import type { Speaker, SpeakerStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  number: number;
  speaker: Speaker;
  /** Firestore doc id of the speaker — needed to look up their most
   *  recent invitation for the chat launcher. */
  speakerId: string;
  /** Meeting date (ISO YYYY-MM-DD). Scopes the invitation lookup. */
  date: string;
}

const STATE_CLS: Record<SpeakerStatus, string> = {
  planned: "bg-parchment-2 text-walnut-2 border-border",
  invited: "bg-brass-soft/40 text-brass-deep border-brass-soft",
  confirmed: "bg-success-soft text-success border-success-soft",
  declined: "bg-danger-soft text-bordeaux border-danger-soft",
};

export function SpeakerRow({ number, speaker, speakerId, date }: Props) {
  const status = speaker.status ?? "planned";
  const wardId = useCurrentWardStore((s) => s.wardId) ?? "";
  return (
    <li className="flex items-center gap-3 h-10 border-b border-border last:border-b-0">
      <div className="font-mono text-[10.5px] tracking-[0.08em] text-brass-deep w-6 shrink-0">
        {String(number).padStart(2, "0")}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-sans text-sm font-semibold text-walnut truncate">
          {speaker.name}
          {speaker.topic && (
            <span className="font-serif italic font-normal text-walnut-3"> · {speaker.topic}</span>
          )}
        </div>
      </div>
      <div
        className={cn(
          "font-mono text-[9.5px] uppercase tracking-[0.12em] px-2.5 py-1.5 rounded-full border whitespace-nowrap",
          STATE_CLS[status],
        )}
      >
        {status}
      </div>
      <SpeakerChatLauncher wardId={wardId} date={date} speaker={speaker} speakerId={speakerId} />
    </li>
  );
}
