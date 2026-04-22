import { toE164 } from "@/features/templates/smsInvitation";
import { usePhoneVerification } from "./usePhoneVerification";

interface Props {
  open: boolean;
  defaultPhone?: string | undefined;
  onClose: () => void;
  /** Called after the user successfully verifies the OTP. Firebase
   *  Auth is already signed in by that point; the caller resumes
   *  whatever action queued the auth (Yes/No submit, chat send). */
  onVerified: () => void;
}

/** Modal that runs Firebase Phone Auth on the speaker side. Phone
 *  capture + OTP confirmation handled by `usePhoneVerification`;
 *  this file owns the chrome (header, inputs, buttons, backdrop). */
export function PhoneAuthDialog({
  open,
  defaultPhone,
  onClose,
  onVerified,
}: Props): React.ReactElement | null {
  const v = usePhoneVerification({ open, defaultPhone, onVerified });

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-70 bg-[rgba(35,24,21,0.45)] flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !v.busy) onClose();
      }}
    >
      <div className="bg-chalk border border-border-strong rounded-[14px] shadow-elev-3 w-full max-w-md p-5 flex flex-col gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium">
            Verify your phone
          </div>
          <div className="font-display text-xl font-semibold text-walnut tracking-[-0.01em] mt-0.5">
            {v.step === "phone" ? "Enter your phone number" : "Enter the code"}
          </div>
          <p className="font-serif text-[12.5px] text-walnut-2 mt-1">
            {v.step === "phone"
              ? "We'll text you a one-time code. Use the number the invitation was sent to."
              : `We sent a 6-digit code to ${toE164(v.phone)}. It should arrive in a few seconds.`}
          </p>
        </div>

        {v.step === "phone" ? (
          <input
            type="tel"
            value={v.phone}
            onChange={(e) => v.setPhone(e.target.value)}
            placeholder="+1 416 555 1234"
            autoFocus
            disabled={v.busy}
            className="font-sans text-[14px] px-3 py-2 bg-chalk border border-border-strong rounded-md text-walnut focus:outline-none focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/15"
          />
        ) : (
          <input
            type="text"
            inputMode="numeric"
            value={v.code}
            onChange={(e) => v.setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            autoFocus
            disabled={v.busy}
            className="font-mono text-[16px] px-3 py-2 bg-chalk border border-border-strong rounded-md text-walnut tracking-[0.2em] focus:outline-none focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/15"
          />
        )}

        {v.error && <p className="font-sans text-[11.5px] text-bordeaux">{v.error}</p>}

        <div className="flex items-center justify-end gap-2 mt-1">
          {v.step === "code" && (
            <button
              type="button"
              onClick={v.reset}
              disabled={v.busy}
              className="mr-auto font-sans text-[12.5px] text-walnut-2 hover:text-walnut px-2 py-1.5"
            >
              Use a different number
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={v.busy}
            className="font-sans text-[12.5px] text-walnut-2 hover:text-walnut px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={v.step === "phone" ? v.sendCode : v.verify}
            disabled={v.busy || (v.step === "code" && v.code.length < 6)}
            className="font-sans text-[12.5px] font-semibold px-3.5 py-1.5 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment hover:bg-bordeaux-deep disabled:opacity-60"
          >
            {v.busy ? "Working…" : v.step === "phone" ? "Send code" : "Verify"}
          </button>
        </div>

        <div ref={v.recaptchaRef} className="self-center" />
      </div>
    </div>
  );
}
