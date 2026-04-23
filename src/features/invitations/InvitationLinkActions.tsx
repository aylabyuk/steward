import { useEffect, useState } from "react";
import { OverflowMenu, type OverflowMenuItem } from "@/components/ui/OverflowMenu";
import type { SpeakerInvitation } from "@/lib/types";
import { callRotateInvitationLink } from "./invitationsCallable";

interface Props {
  wardId: string;
  invitationId: string;
  invitation: SpeakerInvitation;
}

type Status =
  | { kind: "idle" }
  | { kind: "working"; verb: "copy" | "resend" }
  | { kind: "copied" }
  | { kind: "sent"; channels: readonly ("email" | "sms")[] }
  | { kind: "error"; message: string };

const FLASH_MS = 2500;

/** Overflow menu for the bishop viewing an already-sent invitation:
 *  rotate + copy the URL, or rotate + re-deliver via the channels
 *  the invitation originally used. Both actions invalidate any prior
 *  URL the speaker has — the server-side self-heal path handles any
 *  concurrent visit to an older link. */
export function InvitationLinkActions({
  wardId,
  invitationId,
  invitation,
}: Props): React.ReactElement {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const deliverable = availableChannels(invitation);

  useEffect(() => {
    if (status.kind !== "copied" && status.kind !== "sent") return;
    const t = setTimeout(() => setStatus({ kind: "idle" }), FLASH_MS);
    return () => clearTimeout(t);
  }, [status]);

  async function copy() {
    setStatus({ kind: "working", verb: "copy" });
    try {
      const res = await callRotateInvitationLink({
        mode: "rotate",
        wardId,
        invitationId,
        channels: [],
      });
      await navigator.clipboard.writeText(res.inviteUrl);
      setStatus({ kind: "copied" });
    } catch (err) {
      setStatus({ kind: "error", message: (err as Error).message });
    }
  }

  async function resend() {
    if (deliverable.length === 0) return;
    setStatus({ kind: "working", verb: "resend" });
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

  const items: OverflowMenuItem[] = [{ label: "Copy link", onSelect: () => void copy() }];
  if (deliverable.length > 0) {
    items.push({
      label: `Resend via ${formatChannels(deliverable)}`,
      onSelect: () => void resend(),
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
  if (status.kind === "working") return status.verb === "copy" ? "Copying…" : "Sending…";
  if (status.kind === "copied") return "Link copied";
  if (status.kind === "sent") return `Sent via ${formatChannels(status.channels)}`;
  return status.message;
}

function formatChannels(channels: readonly ("email" | "sms")[]): string {
  if (channels.length === 0) return "";
  if (channels.length === 1) return channels[0]!.toUpperCase();
  return channels.map((c) => c.toUpperCase()).join(" + ");
}
