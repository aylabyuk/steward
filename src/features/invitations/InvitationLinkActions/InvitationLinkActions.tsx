import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { OverflowMenu, type OverflowMenuItem } from "@/components/ui/OverflowMenu";
import type { SpeakerInvitation } from "@/lib/types";
import { callRotateInvitationLink } from "../utils/invitationsCallable";
import { useDownloadSentLetter } from "./useDownloadSentLetter";

interface Props {
  wardId: string;
  invitationId: string;
  invitation: SpeakerInvitation;
}

type Status =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "sent"; channels: readonly ("email" | "sms")[] }
  | { kind: "error"; message: string };

const FLASH_MS = 2500;

/** Overflow menu for the bishop viewing an already-sent invitation.
 *  Rotates + redelivers the URL via the invitation's original
 *  channels. The plaintext URL never returns to the bishop's client —
 *  it only ever reaches the speaker's phone/email. Any prior URL the
 *  speaker has is invalidated (the server-side self-heal path handles
 *  concurrent visits to an older link). */
export function InvitationLinkActions({
  wardId,
  invitationId,
  invitation,
}: Props): React.ReactElement {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deliverable = availableChannels(invitation);
  const downloadSent = useDownloadSentLetter(invitation, invitationId);
  const canDownloadSent = Boolean(invitation.editorStateJson || invitation.bodyMarkdown);

  useEffect(() => {
    if (status.kind !== "sent") return;
    const t = setTimeout(() => setStatus({ kind: "idle" }), FLASH_MS);
    return () => clearTimeout(t);
  }, [status]);

  async function resend() {
    if (deliverable.length === 0) return;
    setStatus({ kind: "working" });
    try {
      const res = await callRotateInvitationLink({
        mode: "rotate",
        wardId,
        invitationId,
        channels: deliverable,
      });
      const sent = res.deliveryRecord.filter((d) => d.status === "sent").map((d) => d.channel);
      if (sent.length === 0) {
        setStatus({ kind: "error", message: "Delivery failed." });
        return;
      }
      setStatus({ kind: "sent", channels: sent });
    } catch (err) {
      setStatus({ kind: "error", message: (err as Error).message });
    }
  }

  const items: OverflowMenuItem[] = [];
  if (deliverable.length > 0) {
    items.push({
      label: `Resend Invite via ${formatChannels(deliverable)}`,
      onSelect: () => setConfirmOpen(true),
    });
  }
  if (canDownloadSent) {
    items.push({
      label: downloadSent.busy ? "Preparing…" : "Download Sent Invitation Letter",
      onSelect: () => void downloadSent.trigger().catch(() => {}),
    });
  }

  return (
    <div className="flex items-center gap-2">
      {status.kind !== "idle" && (
        <span
          role="status"
          aria-live="polite"
          className={
            status.kind === "error"
              ? "font-mono text-[10px] uppercase tracking-[0.14em] text-bordeaux"
              : "font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3"
          }
        >
          {statusLabel(status)}
        </span>
      )}
      <OverflowMenu items={items} ariaLabel="Invitation link actions" />
      <ConfirmDialog
        open={confirmOpen}
        title="Resend invitation link?"
        body={`A new invitation link will be delivered to ${invitation.speakerName} via ${formatChannels(deliverable)}. Any earlier link is invalidated.`}
        confirmLabel={`Resend Invite via ${formatChannels(deliverable)}`}
        busy={status.kind === "working"}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void resend();
        }}
      />
      {downloadSent.portal}
    </div>
  );
}

function availableChannels(invitation: SpeakerInvitation): readonly ("email" | "sms")[] {
  const out: ("email" | "sms")[] = [];
  if (invitation.speakerEmail) out.push("email");
  if (invitation.speakerPhone) out.push("sms");
  return out;
}

function statusLabel(status: Status): string {
  if (status.kind === "working") return "Sending…";
  if (status.kind === "sent") return `Sent via ${formatChannels(status.channels)}`;
  return status.message;
}

function formatChannels(channels: readonly ("email" | "sms")[]): string {
  if (channels.length === 0) return "";
  if (channels.length === 1) return channels[0]!.toUpperCase();
  return channels.map((c) => c.toUpperCase()).join(" + ");
}
