import { useState } from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { isValidEmail } from "@/lib/email";
import { type Calling, type Ward } from "@/lib/types";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { CALLING_OPTIONS } from "../settings/callingLabels";
import { sendInvite } from "./inviteActions";
import { INVITE_INPUT_CLS, InviteField } from "./inviteFormField";
import { openInviteMailto } from "./inviteMailto";

interface Props {
  wardId: string;
  ward: Ward | null;
  inviter: { uid: string; displayName: string } | null;
  open: boolean;
  onClose: () => void;
}

export function InviteMemberDialog({ wardId, ward, inviter, open, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [calling, setCalling] = useState<Calling>("ward_clerk");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useLockBodyScroll(open);
  if (!open) return null;

  function reset() {
    setEmail("");
    setDisplayName("");
    setCalling("ward_clerk");
    setBusy(false);
    setError(null);
  }

  const ready = isValidEmail(email) && displayName.trim().length > 0 && Boolean(inviter && ward);

  async function submit() {
    if (!inviter || !ward) return;
    setBusy(true);
    setError(null);
    try {
      await sendInvite({
        wardId,
        wardName: ward.name,
        email,
        displayName,
        calling,
        invitedBy: inviter.uid,
        invitedByName: inviter.displayName,
      });
      openInviteMailto({
        email,
        displayName,
        wardName: ward.name,
        wardId,
        inviterName: inviter.displayName,
      });
      reset();
      onClose();
    } catch (e) {
      setError(friendlyWriteError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Invite member"
    >
      <div className="w-full max-w-md rounded-[14px] border border-border-strong bg-chalk p-6 shadow-elev-3">
        <h2 className="font-display text-[20px] font-semibold text-walnut tracking-[-0.005em]">
          Invite member
        </h2>
        <p className="mt-1 font-serif italic text-[13px] text-walnut-3">
          They'll receive an email with a link; once they sign in they'll see the invite and can
          accept it in one click.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <InviteField label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={INVITE_INPUT_CLS}
              placeholder="name@example.com"
            />
          </InviteField>
          <InviteField label="Display name">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={INVITE_INPUT_CLS}
              placeholder="Jane Doe"
            />
          </InviteField>
          <InviteField label="Calling">
            <select
              value={calling}
              onChange={(e) => setCalling(e.target.value as Calling)}
              className={INVITE_INPUT_CLS}
            >
              {CALLING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </InviteField>
        </div>
        {error && <p className="mt-3 font-sans text-[12.5px] text-bordeaux">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="rounded-md border border-border-strong bg-chalk px-3.5 py-2 font-sans text-[13px] font-semibold text-walnut hover:bg-parchment-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!ready || busy}
            className="rounded-md border border-bordeaux bg-bordeaux px-3.5 py-2 font-sans text-[13px] font-semibold text-chalk hover:bg-bordeaux-deep disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? "Sending…" : "Send invite"}
          </button>
        </div>
      </div>
    </div>
  );
}
