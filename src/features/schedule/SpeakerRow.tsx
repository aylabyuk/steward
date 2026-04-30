import { SpeakerChatLauncher } from "@/features/invitations/SpeakerChatLauncher";
import { SpeakerStatusMenu } from "@/features/schedule/SpeakerStatusMenu/SpeakerStatusMenu";
import { updateSpeaker } from "@/features/speakers/utils/speakerActions";
import { speakerTopicForDisplay } from "@/features/speakers/utils/topicDisplay";
import { Link } from "@/lib/nav";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import type { Speaker, SpeakerStatus } from "@/lib/types";

interface Props {
  number: number;
  speaker: Speaker;
  /** Firestore doc id of the speaker — needed to look up their most
   *  recent invitation for the chat launcher. */
  speakerId: string;
  /** Meeting date (ISO YYYY-MM-DD). Scopes the invitation lookup. */
  date: string;
}

/** Filled speaker row. The body (number, name, topic) is a Link to the
 *  per-row Assign + Invite edit page; the status menu and chat
 *  launcher are sibling tap targets outside the link so opening
 *  either doesn't navigate. */
export function SpeakerRow({ number, speaker, speakerId, date }: Props) {
  const status: SpeakerStatus = speaker.status ?? "planned";
  const wardId = useCurrentWardStore((s) => s.wardId) ?? "";
  const currentUserUid = useAuthStore((s) => s.user?.uid);

  async function onStatusChange(next: SpeakerStatus) {
    if (!wardId) return;
    await updateSpeaker(wardId, date, speakerId, { status: next });
  }

  return (
    <li className="flex items-center gap-3 h-16 border-b border-border last:border-b-0">
      <Link
        to={`/week/${date}/speaker/${speakerId}/assign`}
        className="flex items-center gap-3 flex-1 min-w-0 hover:bg-parchment-2 transition-colors -mx-1 px-1 rounded-sm"
      >
        <div className="font-mono text-[10.5px] tracking-[0.08em] text-brass-deep w-6 shrink-0">
          {String(number).padStart(2, "0")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-sans text-sm font-semibold text-walnut truncate">{speaker.name}</div>
          <div className="font-serif italic text-sm text-walnut-2 truncate">
            {speakerTopicForDisplay(speaker.topic)}
          </div>
        </div>
      </Link>
      <SpeakerStatusMenu
        status={status}
        onChange={onStatusChange}
        {...(speaker.statusSource ? { currentStatusSource: speaker.statusSource } : {})}
        {...(speaker.statusSetBy ? { currentStatusSetBy: speaker.statusSetBy } : {})}
        {...(currentUserUid !== undefined ? { currentUserUid } : {})}
      />
      <SpeakerChatLauncher wardId={wardId} date={date} speaker={speaker} speakerId={speakerId} />
    </li>
  );
}
