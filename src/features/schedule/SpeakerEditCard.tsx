import { cn } from "@/lib/cn";
import { isValidEmail } from "@/lib/email";
import { isE164, toE164 } from "@/features/templates/smsInvitation";
import { SpeakerCardHeader } from "./SpeakerCardHeader";
import type { Draft } from "./speakerDraft";
import { SpeakerLockedBand } from "./SpeakerLockedBand";
import { SpeakerRolePicker } from "./SpeakerRolePicker";

interface Props {
  draft: Draft;
  index: number;
  onChange: (partial: Partial<Draft>) => void;
  onRemove: () => void;
  /** Step-2 read-only mode: disables all inputs, hides the remove
   *  button, and shows the Prepare-invitation / open-conversation
   *  action band. Same card shell renders in both modes so the
   *  modal's dimensions stay stable across steps. `invitationId` +
   *  `onOpenChat` drive the non-planned "open conversation" button;
   *  the parent is responsible for closing the Assign modal before
   *  the chat dialog opens. */
  locked?: {
    date: string;
    invitationId?: string | null;
    onOpenChat?: (invitationId: string) => void;
  };
}

const INPUT_CLS =
  "font-sans text-[13.5px] px-2.5 py-2 bg-chalk border border-border-strong rounded-md text-walnut w-full transition-colors placeholder:text-walnut-3 focus:outline-none focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/15 disabled:bg-parchment-2 disabled:text-walnut-2 disabled:cursor-not-allowed";

// Matches INPUT_CLS dimensions so swapping between the disabled input
// and the "Nothing set" label in step 2 doesn't shift the card.
const NOTHING_SET_CLS =
  "font-sans italic text-[13.5px] px-2.5 py-2 bg-parchment-2 border border-border-strong rounded-md text-walnut-3 w-full";

const LABEL_CLS = "font-mono text-[9.5px] uppercase tracking-[0.14em] text-brass-deep font-medium";

export function SpeakerEditCard({ draft, index, onChange, onRemove, locked }: Props) {
  const readOnly = Boolean(locked);
  return (
    <div className="bg-chalk border border-border rounded-lg p-3 flex flex-col">
      <SpeakerCardHeader index={index} onRemove={readOnly ? null : onRemove} />

      <SpeakerLockedBand
        draft={draft}
        date={locked?.date ?? ""}
        step={locked ? "invite" : "edit"}
        invitationId={locked?.invitationId ?? null}
        {...(locked?.onOpenChat ? { onOpenChat: locked.onOpenChat } : {})}
      />

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
          {readOnly && !draft.email.trim() ? (
            <div className={NOTHING_SET_CLS}>Nothing set</div>
          ) : (
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
          )}
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
          {readOnly && !draft.phone.trim() ? (
            <div className={NOTHING_SET_CLS}>Nothing set</div>
          ) : (
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
          )}
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
          {readOnly && !draft.topic.trim() ? (
            <div className={NOTHING_SET_CLS}>Nothing set</div>
          ) : (
            <input
              value={draft.topic}
              onChange={(e) => onChange({ topic: e.target.value })}
              disabled={readOnly}
              placeholder="e.g. On the still, small voice"
              className={INPUT_CLS}
            />
          )}
        </label>
        <SpeakerRolePicker
          role={draft.role}
          readOnly={readOnly}
          onChange={(role) => onChange({ role })}
        />
      </div>
    </div>
  );
}
