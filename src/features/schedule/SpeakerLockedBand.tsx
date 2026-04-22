import { useState } from "react";
import { BishopInvitationDialog } from "@/features/invitations/BishopInvitationDialog";
import { applyResponseToSpeaker } from "@/features/invitations/invitationActions";
import { useLatestInvitation } from "@/features/invitations/useLatestInvitation";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import type { Draft } from "./speakerDraft";

interface Props {
  draft: Draft;
  date: string;
}

/** Step-2 locked band. Renders whichever of four states applies:
 *  1. **No invitation sent yet** — primary "Prepare invitation →"
 *     button that opens the Prepare page in a new tab (matches the
 *     pre-#16 behavior for the planned case).
 *  2. **Sent, no response yet** — muted "Awaiting reply" text plus
 *     an Open conversation button that launches the chat dialog.
 *  3. **Response landed, not acknowledged** — Response strip with
 *     the answer + optional reason + primary Apply button, plus
 *     the Open conversation affordance.
 *  4. **Acknowledged** — muted "Applied · status is {X}" chip and
 *     the Open conversation affordance. */
export function SpeakerLockedBand({ draft, date }: Props): React.ReactElement {
  const wardId = useCurrentWardStore((s) => s.wardId) ?? "";
  const user = useAuthStore((s) => s.user);
  const [chatOpen, setChatOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const latest = useLatestInvitation(wardId || null, date, draft.id);

  function openPrepare() {
    if (!draft.id) return;
    const url = `/week/${encodeURIComponent(date)}/speaker/${encodeURIComponent(draft.id)}/prepare`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleApply() {
    if (!latest.invitation || !user) return;
    setApplying(true);
    setApplyError(null);
    try {
      await applyResponseToSpeaker({
        wardId,
        token: latest.invitation.token,
        bishopUid: user.uid,
      });
    } catch (err) {
      setApplyError((err as Error).message);
    } finally {
      setApplying(false);
    }
  }

  const invitation = latest.invitation;

  if (!invitation) {
    // State 1 — no send yet. Keep the pre-#16 behavior: primary
    // Prepare button for planned speakers; muted fallback otherwise.
    if (draft.status === "planned") {
      return (
        <button
          type="button"
          onClick={openPrepare}
          disabled={draft.id === null}
          aria-label={`Open prepare invitation for ${draft.name || "speaker"}`}
          className="w-full mb-2.5 border border-bordeaux-deep bg-bordeaux text-parchment rounded-md font-mono text-[10px] uppercase tracking-[0.14em] font-medium py-2 hover:bg-bordeaux-deep shadow-[0_1px_0_rgba(35,24,21,0.18)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Prepare invitation →
        </button>
      );
    }
    return (
      <div className="w-full mb-2.5 border border-border-strong bg-parchment-2 text-walnut-2 rounded-md font-serif italic text-[11.5px] py-2 px-2.5 text-center">
        {draft.status === "confirmed"
          ? "Already confirmed — open edit mode to change."
          : "Already invited — open edit mode to change."}
      </div>
    );
  }

  const response = invitation.response;
  const target = response?.answer === "yes" ? "confirmed" : "declined";

  return (
    <>
      <div className="w-full mb-2.5 border border-border-strong bg-parchment-2 rounded-md flex flex-col gap-1.5 py-2 px-2.5">
        {response ? (
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium">
              Responded · {response.answer === "yes" ? "Yes" : "No"}
              {response.acknowledgedAt && <> — Applied</>}
            </span>
            {response.acknowledgedAt ? (
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
                status is {target}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleApply}
                disabled={applying}
                className="font-sans text-[11.5px] font-semibold px-2.5 py-1 rounded border border-bordeaux-deep bg-bordeaux text-parchment hover:bg-bordeaux-deep disabled:opacity-60"
              >
                {applying ? "Applying…" : `Apply as ${target}`}
              </button>
            )}
          </div>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3 text-center">
            Awaiting reply
          </span>
        )}
        {response?.reason && (
          <p className="font-serif italic text-[11.5px] text-walnut-2">"{response.reason}"</p>
        )}
        {applyError && <p className="font-sans text-[11px] text-bordeaux">{applyError}</p>}
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="font-sans text-[11.5px] font-semibold px-2 py-1 rounded border border-border-strong bg-chalk text-walnut hover:bg-parchment-2 self-center"
        >
          Open conversation
        </button>
      </div>
      <BishopInvitationDialog
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        wardId={wardId}
        token={invitation.token}
        invitation={invitation}
      />
    </>
  );
}
