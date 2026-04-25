import { cn } from "@/lib/cn";
import { isValidEmail } from "@/lib/email";
import { isE164, toE164 } from "@/features/templates/smsInvitation";
import type { Draft } from "./speakerDraft";
import { SpeakerRolePicker } from "./SpeakerRolePicker";

const INPUT_CLS =
  "font-sans text-[13.5px] px-2.5 py-2 bg-chalk border border-border-strong rounded-md text-walnut w-full transition-colors placeholder:text-walnut-3 focus:outline-none focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/15";

// Visual treatment for fields on a non-planned speaker card.
// Inputs stay editable (project rule: nothing is ever hard-locked)
// but are de-emphasised so a bishop scanning the modal doesn't
// accidentally retype a name that's already been invited.
const SOFT_LOCKED_INPUT_CLS = "bg-parchment-2 text-walnut-2";

const LABEL_CLS = "font-mono text-[9.5px] uppercase tracking-[0.14em] text-brass-deep font-medium";

const ERROR_BORDER_CLS = "border-bordeaux focus:border-bordeaux focus:ring-bordeaux/25";

interface Props {
  draft: Draft;
  softLocked: boolean;
  onChange: (partial: Partial<Draft>) => void;
}

export function SpeakerEditFields({ draft, softLocked, onChange }: Props) {
  const cls = (extras?: string) => cn(INPUT_CLS, softLocked && SOFT_LOCKED_INPUT_CLS, extras);
  const emailInvalid = draft.email.trim().length > 0 && !isValidEmail(draft.email);
  const phoneInvalid = draft.phone.trim().length > 0 && !isE164(draft.phone);
  return (
    <div className="flex flex-col gap-2.5">
      <label className="flex flex-col gap-1">
        <span className={LABEL_CLS}>
          Name <span className="text-bordeaux">*</span>
        </span>
        <input
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Sister Hannah Reeves"
          className={cls()}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={LABEL_CLS}>
          Email <Optional suffix="enable email communication" />
        </span>
        <input
          type="email"
          value={draft.email}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder="name@example.com"
          aria-invalid={emailInvalid}
          className={cls(emailInvalid ? ERROR_BORDER_CLS : "")}
        />
        {emailInvalid && (
          <FieldError>Enter a valid email address (e.g. name@example.com).</FieldError>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className={LABEL_CLS}>
          Phone <Optional suffix="enables Send SMS" />
        </span>
        <input
          type="tel"
          value={draft.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          onBlur={() => {
            const normalized = toE164(draft.phone);
            if (normalized !== draft.phone) onChange({ phone: normalized });
          }}
          placeholder="+1 416 555 1234"
          aria-invalid={phoneInvalid}
          className={cls(phoneInvalid ? ERROR_BORDER_CLS : "")}
        />
        {phoneInvalid && (
          <FieldError>Use international format: +1 then 10 digits, e.g. +14165551234.</FieldError>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className={LABEL_CLS}>
          Topic <Optional suffix="let the speaker choose a topic" />
        </span>
        <input
          value={draft.topic}
          onChange={(e) => onChange({ topic: e.target.value })}
          placeholder="e.g. On the still, small voice"
          className={cls()}
        />
      </label>

      <SpeakerRolePicker role={draft.role} onChange={(role) => onChange({ role })} />
    </div>
  );
}

function Optional({ suffix }: { suffix?: string }) {
  return (
    <span className="text-walnut-3 font-normal normal-case tracking-normal">
      {" "}
      — optional{suffix ? `, ${suffix}` : ""}
    </span>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <span className="font-sans text-[11.5px] text-bordeaux mt-0.5">{children}</span>;
}
