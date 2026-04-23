import { useState } from "react";
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

/** Two-button panel for the bishop viewing an already-sent invitation:
 *  rotate + copy the URL, or rotate + re-deliver via the same channels
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
        setStatus({ kind: "error", message: "All delivery attempts failed." });
        return;
      }
      setStatus({ kind: "sent", channels: sent });
    } catch (err) {
      setStatus({ kind: "error", message: (err as Error).message });
    }
  }

  const working = status.kind === "working";

  return (
    <div className="flex flex-col gap-1 items-end">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={copy}
          disabled={working}
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-2 hover:text-walnut px-2 py-1 border border-border rounded-md hover:bg-parchment-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {copyLabel(status)}
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={working || deliverable.length === 0}
          title={deliverable.length === 0 ? "No email or phone on file" : undefined}
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-parchment px-2 py-1 border border-bordeaux-deep bg-bordeaux hover:bg-bordeaux-deep rounded-md disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {status.kind === "working" && status.verb === "resend"
            ? "Sending…"
            : `Resend ${formatChannels(deliverable)}`}
        </button>
      </div>
      {status.kind === "sent" && (
        <p className="font-mono text-[10px] text-walnut-3" aria-live="polite">
          Sent via {formatChannels(status.channels)}
        </p>
      )}
      {status.kind === "error" && (
        <p className="font-mono text-[10px] text-bordeaux" aria-live="polite">
          {status.message}
        </p>
      )}
    </div>
  );
}

function availableChannels(invitation: SpeakerInvitation): readonly ("email" | "sms")[] {
  const out: ("email" | "sms")[] = [];
  if (invitation.speakerEmail) out.push("email");
  if (invitation.speakerPhone) out.push("sms");
  return out;
}

function copyLabel(status: Status): string {
  if (status.kind === "copied") return "Copied ✓";
  if (status.kind === "working" && status.verb === "copy") return "Copying…";
  return "Copy link";
}

function formatChannels(channels: readonly ("email" | "sms")[]): string {
  if (channels.length === 0) return "";
  if (channels.length === 1) return channels[0]!.toUpperCase();
  return channels.map((c) => c.toUpperCase()).join(" + ");
}
