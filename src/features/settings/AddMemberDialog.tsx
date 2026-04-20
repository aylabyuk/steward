import { useState } from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import type { Calling } from "@/lib/types";
import { CALLING_OPTIONS } from "./callingLabels";
import { addMember } from "./memberActions";

interface Props {
  wardId: string;
  open: boolean;
  onClose: () => void;
}

export function AddMemberDialog({ wardId, open, onClose }: Props) {
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [calling, setCalling] = useState<Calling>("ward_clerk");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useLockBodyScroll(open);
  if (!open) return null;

  function reset() {
    setUid("");
    setEmail("");
    setDisplayName("");
    setCalling("ward_clerk");
    setError(null);
    setBusy(false);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await addMember({
        wardId,
        uid: uid.trim(),
        email: email.trim(),
        displayName: displayName.trim(),
        calling,
      });
      reset();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const ready = uid.trim() && email.trim() && displayName.trim();

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add member"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">Add member</h2>
        <p className="mt-1 text-xs text-slate-500">
          The new member's UID is shown on the access-required page after they try to sign in. Ask
          them to share it with you.
        </p>
        <div className="mt-4 flex flex-col gap-3 text-sm">
          <Labeled label="Google UID">
            <input value={uid} onChange={(e) => setUid(e.target.value)} className={input} />
          </Labeled>
          <Labeled label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={input}
            />
          </Labeled>
          <Labeled label="Display name">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={input}
            />
          </Labeled>
          <Labeled label="Calling">
            <select
              value={calling}
              onChange={(e) => setCalling(e.target.value as Calling)}
              className={input}
            >
              {CALLING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Labeled>
        </div>
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!ready || busy}
            className="rounded-md bg-slate-900 px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            {busy ? "Adding…" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

const input = "rounded-md border border-slate-300 px-2 py-1 text-sm";

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
