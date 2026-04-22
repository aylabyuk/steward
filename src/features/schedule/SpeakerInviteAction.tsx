import { useState } from "react";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { formatAssignedDate } from "@/features/templates/letterDates";
import { renderSpeakerEmailBody } from "@/features/templates/renderSpeakerEmailBody";
import { sendSpeakerInvitation } from "@/features/templates/sendSpeakerInvitation";
import { useSpeakerEmailTemplate } from "@/features/templates/useSpeakerEmailTemplate";
import { isValidEmail } from "@/lib/email";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import type { Draft } from "./speakerDraft";
import { InviteActionBtn } from "./SpeakerInviteActionBtn";
import { CheckIcon, MailIcon, PrintIcon, SendIcon } from "./SpeakerInviteIcons";

interface Props {
  draft: Draft;
  date: string;
  onMarkInvited: () => void;
  onPrint: () => void;
}

export function InviteAction({ draft, date, onMarkInvited, onPrint }: Props) {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const me = useCurrentMember();
  const ward = useWardSettings();
  const authUser = useAuthStore((s) => s.user);
  const { data: emailTemplate } = useSpeakerEmailTemplate();
  const inviterName =
    me?.data.displayName ?? authUser?.displayName ?? authUser?.email ?? "The bishopric";
  const email = draft.email.trim();
  const hasEmail = email.length > 0;
  const emailValid = isValidEmail(email);
  const invited = draft.status === "invited" || draft.status === "confirmed";
  const persisted = draft.id !== null;
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendEmail() {
    if (!emailValid || !wardId || !persisted || !draft.id) return;
    setError(null);
    setSending(true);
    try {
      const { token } = await sendSpeakerInvitation({
        wardId,
        meetingDate: date,
        speakerId: draft.id,
        speakerName: draft.name,
        speakerTopic: draft.topic.trim() || undefined,
        inviterName,
      });
      const inviteUrl = `${window.location.origin}/invite/speaker/${wardId}/${token}`;
      const body = renderSpeakerEmailBody(
        {
          speakerName: draft.name,
          date: formatAssignedDate(date),
          wardName: ward.data?.name ?? "",
          inviterName,
          topic: draft.topic.trim() || "a topic of your choosing",
          inviteUrl,
        },
        { template: emailTemplate?.bodyMarkdown },
      );
      const subject = encodeURIComponent(`Invitation to speak — ${prettyDate(date)}`);
      window.location.href = `mailto:${email}?subject=${subject}&body=${encodeURIComponent(body)}`;
      onMarkInvited();
    } catch (e) {
      setError(friendlyWriteError(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-parchment-2 border border-border rounded-lg px-3 py-2.5 mb-3 flex flex-col gap-2">
      <div className="flex items-center flex-wrap gap-y-2.5 gap-x-3.5">
        <div className="flex items-center gap-2 text-[13px] text-walnut-2 min-w-0 flex-1 basis-50 font-serif italic">
          {!hasEmail && (
            <span>No email on file — deliver a printed letter or reach out directly.</span>
          )}
          {hasEmail && emailValid && (
            <>
              <MailIcon />
              <span className="truncate">
                Send invitation to{" "}
                <strong className="font-semibold not-italic text-bordeaux font-sans">
                  {email}
                </strong>
              </span>
            </>
          )}
          {hasEmail && !emailValid && (
            <span className="text-bordeaux">
              Invalid email format — fix the address or deliver a printed letter.
            </span>
          )}
        </div>
        <div className="inline-flex gap-1.5 shrink-0 flex-wrap ml-auto">
          <InviteActionBtn onClick={onMarkInvited} icon={invited ? <CheckIcon /> : null}>
            Mark invited
          </InviteActionBtn>
          <InviteActionBtn onClick={onPrint} icon={<PrintIcon />} primary={!emailValid}>
            Print letter
          </InviteActionBtn>
          {hasEmail && (
            <InviteActionBtn
              onClick={() => void handleSendEmail()}
              icon={<SendIcon />}
              primary
              disabled={!emailValid || !persisted || sending}
            >
              {sending ? "Sending…" : "Send email"}
            </InviteActionBtn>
          )}
        </div>
      </div>
      {hasEmail && emailValid && !persisted && (
        <p className="font-sans text-[11.5px] text-walnut-3">
          Save the speaker first to enable email — we generate a personal invitation link tied to
          this row.
        </p>
      )}
      {error && <p className="font-sans text-[12px] text-bordeaux">{error}</p>}
    </div>
  );
}

function prettyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
