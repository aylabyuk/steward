import { formatShortSunday } from "@/features/schedule/dateFormat";
import type { SpeakerStatus } from "@/lib/types";

interface Props {
  /** The speaker's own Yes/No reply (null until they submit). Used as
   *  the fallback when no bishop-driven transition has landed yet. */
  answer: "yes" | "no" | null | undefined;
  /** The authoritative current status, mirrored from the speaker doc
   *  by the bishop's client when they apply a response or change the
   *  status via the chat-banner pills. When present, this drives the
   *  banner; when absent we fall back to `answer`. */
  currentStatus?: SpeakerStatus | null;
  /** ISO `YYYY-MM-DD` of the meeting the speaker is assigned to.
   *  Substituted into the subtitle copy instead of the ambiguous
   *  "this Sunday" so the date is unambiguous. */
  meetingDate: string;
}

/** Speaker-side confirmation banner rendered under the conversation
 *  header. Pivots through three layers in priority order:
 *
 *    1. Bishop-applied terminal state (`currentStatus`) wins — once
 *       the bishopric has confirmed or declined, the speaker sees
 *       the effective outcome even if it differs from their reply.
 *       This covers the "changed my mind mid-conversation" path
 *       where the speaker originally said yes but asked to bow out
 *       in chat, and the bishop flipped status to declined.
 *    2. Fallback to the speaker's own Yes/No submission. Shown while
 *       the bishop hasn't acknowledged yet, or for pre-rollout
 *       invitations that predate the `currentSpeakerStatus` mirror.
 *    3. Nothing before the speaker has replied (keeps the chat
 *       header quiet while Quick-Action buttons are visible). */
export function SpeakerResponseBanner({
  answer,
  currentStatus,
  meetingDate,
}: Props): React.ReactElement | null {
  const when = formatShortSunday(meetingDate);
  if (currentStatus === "confirmed") {
    return (
      <Banner
        tone="success"
        title={`Your assignment is confirmed for ${when}. Thank you!`}
        subtitle="The bishopric will follow up with any remaining details in the chat below."
      />
    );
  }
  if (currentStatus === "declined") {
    return (
      <Banner
        tone="danger"
        title="Your assignment has been updated to declined."
        subtitle={`You are no longer scheduled to speak on ${when}. See the chat below for any follow-up.`}
      />
    );
  }
  if (answer === "yes") {
    return (
      <Banner
        tone="success"
        title={`You accepted the invitation to speak on ${when}. Thank you!`}
        subtitle="The bishopric will follow up with any remaining details in the chat below."
      />
    );
  }
  if (answer === "no") {
    return (
      <Banner
        tone="danger"
        title={`You declined the invitation to speak on ${when}.`}
        subtitle="The bishopric has been notified and will respond in the chat below if needed."
      />
    );
  }
  return null;
}

function Banner({
  tone,
  title,
  subtitle,
}: {
  tone: "success" | "danger";
  title: string;
  subtitle: string;
}) {
  const bg =
    tone === "success"
      ? "bg-gradient-to-br from-success-soft to-success-soft/60"
      : "bg-gradient-to-br from-danger-soft to-danger-soft/60";
  const text = tone === "success" ? "text-success" : "text-bordeaux";
  return (
    <div className={`px-4 py-3 border-b border-border ${bg}`}>
      <p className={`font-sans text-[13.5px] font-semibold leading-snug ${text}`}>{title}</p>
      <p className="font-serif italic text-[12.5px] text-walnut-2 mt-1">{subtitle}</p>
    </div>
  );
}
