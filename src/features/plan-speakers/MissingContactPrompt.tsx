import { useState } from "react";
import type { Speaker } from "@/lib/types";
import type { WithId } from "@/hooks/_sub";
import { updateSpeaker } from "@/features/speakers/speakerActions";
import { isE164, toE164 } from "@/features/templates/smsInvitation";
import { isValidEmail } from "@/lib/email";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { cn } from "@/lib/cn";
import { WizardFooter } from "./WizardFooter";

const INPUT_CLS =
  "font-sans text-[14px] px-3 py-2.5 bg-chalk border border-border-strong rounded-md text-walnut w-full focus:outline-none focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/15";
const INPUT_INVALID_CLS = "border-bordeaux focus:border-bordeaux focus:ring-bordeaux/25";
const LABEL_CLS = "font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium";
const HINT_CLS = "font-sans text-[11.5px] text-bordeaux mt-0.5";

interface Props {
  speaker: WithId<Speaker>;
  wardId: string;
  date: string;
  onCancel: () => void;
  onSaved: () => void;
}

export function MissingContactPrompt({ speaker, wardId, date, onCancel, onSaved }: Props) {
  const [email, setEmail] = useState(speaker.data.email ?? "");
  const [phone, setPhone] = useState(speaker.data.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedEmail = email.trim();
  const trimmedPhone = phone.trim();
  const emailFilled = trimmedEmail.length > 0;
  const phoneFilled = trimmedPhone.length > 0;
  const emailValid = isValidEmail(trimmedEmail);
  const phoneValid = isE164(trimmedPhone);
  const emailError = emailFilled && !emailValid;
  const phoneError = phoneFilled && !phoneValid;
  const hasOneValid = (emailFilled && emailValid) || (phoneFilled && phoneValid);
  const noneFilled = !emailFilled && !phoneFilled;
  const canSave = hasOneValid && !emailError && !phoneError && !saving;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateSpeaker(wardId, date, speaker.id, {
        email: trimmedEmail,
        phone: trimmedPhone,
      });
      onSaved();
    } catch (e) {
      setError(friendlyWriteError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl w-full mx-auto px-5 sm:px-8 py-3">
          <div className="bg-chalk border border-border rounded-lg p-5 flex flex-col gap-4">
            <h2 className="font-display text-[18px] font-semibold text-walnut">
              Add contact info for {speaker.data.name}
            </h2>
            <p className="font-serif text-[13.5px] text-walnut-2 leading-relaxed">
              Provide an email, a phone number, or both. We'll save it to their speaker record so
              you can reach them again later.
            </p>

            <label className="flex flex-col gap-1">
              <span className={LABEL_CLS}>Email</span>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={cn(INPUT_CLS, emailError && INPUT_INVALID_CLS)}
                aria-invalid={emailError}
              />
              {emailError && (
                <span className={HINT_CLS}>
                  Enter a valid email address (e.g. name@example.com).
                </span>
              )}
            </label>
            <label className="flex flex-col gap-1">
              <span className={LABEL_CLS}>Phone</span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => setPhone((p) => toE164(p))}
                placeholder="+1 416 555 1234"
                className={cn(INPUT_CLS, phoneError && INPUT_INVALID_CLS)}
                aria-invalid={phoneError}
              />
              {phoneError && (
                <span className={HINT_CLS}>
                  Use international format: + then country code and digits, e.g. +14165551234.
                </span>
              )}
            </label>

            {noneFilled && (
              <p className="font-sans text-[12.5px] text-walnut-3">
                Enter at least one — email or phone.
              </p>
            )}
            {error && <p className="font-sans text-[12.5px] text-bordeaux">{error}</p>}
          </div>
        </div>
      </div>

      <WizardFooter align="between">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-md border border-border-strong bg-chalk px-3.5 py-2 font-sans text-[13px] font-semibold text-walnut hover:bg-parchment-2 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="rounded-md border border-bordeaux bg-bordeaux px-4 py-2.5 font-sans text-[14px] font-semibold text-chalk hover:bg-bordeaux-deep disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save & continue →"}
        </button>
      </WizardFooter>
    </div>
  );
}
