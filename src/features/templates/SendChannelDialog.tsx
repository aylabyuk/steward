import { useEffect, useState } from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { isE164, toE164 } from "@/features/templates/smsInvitation";
import { cn } from "@/lib/cn";
import { isValidEmail } from "@/lib/email";

export type ChannelKind = "email" | "sms";

interface Props {
  open: boolean;
  channel: ChannelKind;
  speakerName: string;
  /** Current on-file value. The dialog prefills the input with it so
   *  the bishop can confirm-as-is or tweak in place. Empty string is
   *  fine — the dialog's "add" flow handles the new-value case. */
  currentValue: string;
  busy: boolean;
  onCancel: () => void;
  /** Called with the final value after client-side validation. The
   *  parent is responsible for persisting it to the speaker doc (if
   *  changed) and firing the actual send. */
  onConfirm: (value: string) => void;
}

/** Combined input + send modal used by the Prepare Invitation action
 *  bar. Replaces the earlier static-body ConfirmDialog for the email
 *  and SMS actions so the bishop always reviews (and can edit) the
 *  destination before anything fires — same UX whether the record has
 *  a value on file or not. */
export function SendChannelDialog({
  open,
  channel,
  speakerName,
  currentValue,
  busy,
  onCancel,
  onConfirm,
}: Props) {
  useLockBodyScroll(open);
  const [value, setValue] = useState(currentValue);
  const [touched, setTouched] = useState(false);

  // Re-seed the input when the dialog opens (or the underlying record
  // changes). Without this, re-opening the dialog after a rename would
  // show the stale last-typed value.
  useEffect(() => {
    if (!open) return;
    setValue(currentValue);
    setTouched(false);
  }, [open, currentValue]);

  useEffect(() => {
    if (!open) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onCancel();
    }
    document.addEventListener("keydown", handleEsc, true);
    return () => document.removeEventListener("keydown", handleEsc, true);
  }, [open, onCancel]);

  if (!open) return null;

  const normalized = channel === "sms" ? toE164(value) : value.trim();
  const valid = channel === "email" ? isValidEmail(normalized) : isE164(normalized);
  const showInvalid = touched && normalized.length > 0 && !valid;
  const disabled = busy || !valid;

  const copy = channel === "email" ? EMAIL_COPY : SMS_COPY;

  function submit() {
    if (!valid) {
      setTouched(true);
      return;
    }
    onConfirm(normalized);
  }

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-channel-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-sm rounded-[14px] border border-border-strong bg-chalk p-6 shadow-elev-3">
        <h2
          id="send-channel-title"
          className="font-display text-[19px] font-semibold text-walnut mb-1.5"
        >
          {copy.title.replace("{name}", speakerName)}
        </h2>
        <p className="font-serif text-[13.5px] text-walnut-2 leading-relaxed mb-4">{copy.body}</p>
        <label className="flex flex-col gap-1 mb-4">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brass-deep font-medium">
            {copy.label}
          </span>
          <input
            type={channel === "email" ? "email" : "tel"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={copy.placeholder}
            autoFocus
            disabled={busy}
            aria-invalid={showInvalid}
            className={cn(
              "font-sans text-[13.5px] px-2.5 py-2 bg-chalk border border-border-strong rounded-md text-walnut w-full transition-colors focus:outline-none focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/15 disabled:bg-parchment-2",
              showInvalid && "border-bordeaux focus:border-bordeaux focus:ring-bordeaux/25",
            )}
          />
          {showInvalid && (
            <span className="font-sans text-[11.5px] text-bordeaux mt-0.5">{copy.invalid}</span>
          )}
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-border-strong bg-chalk px-3.5 py-2 font-sans text-[13px] font-semibold text-walnut hover:bg-parchment-2 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={disabled}
            className="rounded-md border border-bordeaux bg-bordeaux px-3.5 py-2 font-sans text-[13px] font-semibold text-chalk hover:bg-bordeaux-deep disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? "Sending…" : copy.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const EMAIL_COPY = {
  title: "Send email to {name}?",
  body: "Confirm or update the email address. Any change is saved to the speaker record so all surfaces stay in sync.",
  label: "Speaker email",
  placeholder: "name@example.com",
  invalid: "Enter a valid email address (e.g. name@example.com).",
  confirmLabel: "Send email",
};

const SMS_COPY = {
  title: "Text invitation to {name}?",
  body: "Confirm or update the phone number. Any change is saved to the speaker record so all surfaces stay in sync.",
  label: "Speaker phone",
  placeholder: "+1 416 555 1234",
  invalid: "Use international format: +1 then 10 digits, e.g. +14165551234.",
  confirmLabel: "Send SMS",
};
