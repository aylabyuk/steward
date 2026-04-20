import { useEffect, useState } from "react";
import { useWardMembers } from "@/hooks/useWardMembers";
import type { AssignmentStatus, Speaker } from "@/lib/types";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { buildMailto } from "./buildMailto";
import { computeCc } from "./computeCc";
import { markSpeakerSent, revertSpeakerSent } from "./speakerActions";

interface Props {
  date: string;
  speakerId: string;
  speaker: Speaker;
  subject: string;
  body: string;
  onBeforeAction: () => Promise<void>;
}

interface Pending {
  kind: "invite_emailed" | "invite_printed";
  prev: AssignmentStatus;
}

const UNDO_WINDOW_MS = 15_000;

export function SendActions({ date, speakerId, speaker, subject, body, onBeforeAction }: Props) {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const authUid = useAuthStore((s) => s.user?.uid);
  const { data: members } = useWardMembers();
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => setPending(null), UNDO_WINDOW_MS);
    return () => clearTimeout(t);
  }, [pending]);

  async function handleSend() {
    if (!wardId || !authUid) return;
    await onBeforeAction();
    const cc = computeCc(members);
    const url = buildMailto({ to: speaker.email ?? "", cc, subject, body });
    window.location.href = url;
    const prev = speaker.status;
    await markSpeakerSent(wardId, date, speakerId, "invite_emailed", authUid);
    setPending({ kind: "invite_emailed", prev });
  }

  async function handlePrint() {
    if (!wardId || !authUid) return;
    await onBeforeAction();
    window.print();
    const prev = speaker.status;
    await markSpeakerSent(wardId, date, speakerId, "invite_printed", authUid);
    setPending({ kind: "invite_printed", prev });
  }

  async function handleUndo() {
    if (!wardId || !pending) return;
    await revertSpeakerSent(wardId, date, speakerId, pending.prev);
    setPending(null);
  }

  const noEmail = !speaker.email;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={noEmail}
          title={noEmail ? "No email on speaker — use Print instead." : undefined}
          className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send via email
        </button>
        <button
          type="button"
          onClick={() => void handlePrint()}
          className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900 hover:bg-slate-100"
        >
          Print letter
        </button>
      </div>
      {pending && (
        <div className="flex items-center gap-3 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-xs text-yellow-900">
          <span className="flex-1">
            Marked as {pending.kind === "invite_emailed" ? "emailed" : "printed"}. Didn't actually
            send?
          </span>
          <button
            type="button"
            onClick={() => void handleUndo()}
            className="rounded-md border border-yellow-400 bg-white px-3 py-1 text-xs text-yellow-900 hover:bg-yellow-100"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
