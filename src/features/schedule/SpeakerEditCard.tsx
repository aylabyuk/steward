import { SPEAKER_ROLES } from "@/lib/types";
import { cn } from "@/lib/cn";
import { isValidEmail } from "@/lib/email";
import { isE164, toE164 } from "@/features/templates/smsInvitation";
import { SpeakerCardHeader } from "./SpeakerCardHeader";
import type { Draft } from "./speakerDraft";
import { SpeakerLockedBand } from "./SpeakerLockedBand";

interface Props {
  draft: Draft;
  index: number;
  onChange: (partial: Partial<Draft>) => void;
  onRemove: () => void;
  /** Step-2 read-only mode: disables all inputs, hides the remove
   *  button, and shows the Prepare-invitation action band. The same
   *  card shell renders in both modes so the modal's dimensions stay
   *  stable across steps. */
  locked?: { date: string };
}

const INPUT_CLS =
  "font-sans text-[13.5px] px-2.5 py-2 bg-chalk border border-border-strong rounded-md text-walnut w-full transition-colors placeholder:text-walnut-3 focus:outline-none focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/15 disabled:bg-parchment-2 disabled:text-walnut-2 disabled:cursor-not-allowed";

const LABEL_CLS = "font-mono text-[9.5px] uppercase tracking-[0.14em] text-brass-deep font-medium";

export function SpeakerEditCard({ draft, index, onChange, onRemove, locked }: Props) {
  const readOnly = Boolean(locked);
  return (
    <div className="bg-chalk border border-border rounded-lg p-3 flex flex-col">
      <SpeakerCardHeader index={index} onRemove={readOnly ? null : onRemove} />

      {locked && <SpeakerLockedBand draft={draft} date={locked.date} />}

      <div className="flex flex-col gap-2.5">
        <label className="flex flex-col gap-1">
          <span className={LABEL_CLS}>
            Name <span className="text-bordeaux">*</span>
          </span>
          <input
            value={draft.name}
            onChange={(e) => onChange({ name: e.target.value })}
            disabled={readOnly}
            placeholder="e.g. Sister Hannah Reeves"
            className={INPUT_CLS}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={LABEL_CLS}>
            Email
            <span className="text-walnut-3 font-normal normal-case tracking-normal">
              {" "}
              — optional
            </span>
          </span>
          <input
            type="email"
            value={draft.email}
            onChange={(e) => onChange({ email: e.target.value })}
            disabled={readOnly}
            placeholder="name@example.com"
            aria-invalid={draft.email.trim().length > 0 && !isValidEmail(draft.email)}
            className={cn(
              INPUT_CLS,
              draft.email.trim().length > 0 &&
                !isValidEmail(draft.email) &&
                "border-bordeaux focus:border-bordeaux focus:ring-bordeaux/25",
            )}
          />
          {!readOnly && draft.email.trim().length > 0 && !isValidEmail(draft.email) && (
            <span className="font-sans text-[11.5px] text-bordeaux mt-0.5">
              Enter a valid email address (e.g. name@example.com).
            </span>
          )}
        </label>
        <label className="flex flex-col gap-1">
          <span className={LABEL_CLS}>
            Phone
            <span className="text-walnut-3 font-normal normal-case tracking-normal">
              {" "}
              — optional, enables Send SMS
            </span>
          </span>
          <input
            type="tel"
            value={draft.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            onBlur={() => {
              const normalized = toE164(draft.phone);
              if (normalized !== draft.phone) onChange({ phone: normalized });
            }}
            disabled={readOnly}
            placeholder="+1 416 555 1234"
            aria-invalid={draft.phone.trim().length > 0 && !isE164(draft.phone)}
            className={cn(
              INPUT_CLS,
              draft.phone.trim().length > 0 &&
                !isE164(draft.phone) &&
                "border-bordeaux focus:border-bordeaux focus:ring-bordeaux/25",
            )}
          />
          {!readOnly && draft.phone.trim().length > 0 && !isE164(draft.phone) && (
            <span className="font-sans text-[11.5px] text-bordeaux mt-0.5">
              Use international format: +1 then 10 digits, e.g. +14165551234.
            </span>
          )}
        </label>
        <label className="flex flex-col gap-1">
          <span className={LABEL_CLS}>
            Topic
            <span className="text-walnut-3 font-normal normal-case tracking-normal">
              {" "}
              — optional
            </span>
          </span>
          <input
            value={draft.topic}
            onChange={(e) => onChange({ topic: e.target.value })}
            disabled={readOnly}
            placeholder="e.g. On the still, small voice"
            className={INPUT_CLS}
          />
        </label>
        <div className="flex flex-col gap-1.5">
          <span className={LABEL_CLS}>Role</span>
          <div className="flex flex-wrap gap-1.5">
            {SPEAKER_ROLES.map((r) => (
              <button
                key={r}
                onClick={() => onChange({ role: r })}
                disabled={readOnly}
                className={cn(
                  "font-mono text-[10px] uppercase tracking-[0.12em] px-2.5 py-1.5 rounded-full border transition-colors disabled:cursor-not-allowed",
                  draft.role === r
                    ? "bg-walnut text-parchment border-walnut disabled:opacity-80"
                    : "bg-chalk text-walnut-2 border-border-strong hover:bg-parchment-2 disabled:opacity-60 disabled:hover:bg-chalk",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
