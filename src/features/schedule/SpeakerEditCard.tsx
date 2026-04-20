import { SPEAKER_ROLES, SPEAKER_STATUSES, type SpeakerStatus } from "@/lib/types";
import { cn } from "@/lib/cn";
import { isValidEmail } from "@/lib/email";
import { printInvitationLetter } from "./printInvitationLetter";
import type { Draft } from "./speakerDraft";
import { InviteAction } from "./SpeakerInviteAction";

interface Props {
  draft: Draft;
  index: number;
  date: string;
  onChange: (partial: Partial<Draft>) => void;
  onRemove: () => void;
}

const STATE_LABELS: Record<SpeakerStatus, string> = {
  planned: "Planned",
  invited: "Invited",
  confirmed: "Confirmed",
  declined: "Declined",
};

const STATE_ACTIVE: Record<SpeakerStatus, string> = {
  planned: "bg-parchment-2 text-walnut",
  invited: "bg-brass-soft text-walnut",
  confirmed: "bg-success-soft text-success",
  declined: "bg-danger-soft text-bordeaux",
};

const INPUT_CLS =
  "font-sans text-[13.5px] px-2.5 py-2 bg-chalk border border-border-strong rounded-md text-walnut w-full transition-colors placeholder:text-walnut-3 focus:outline-none focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/15";

const LABEL_CLS =
  "font-mono text-[9.5px] uppercase tracking-[0.14em] text-brass-deep font-medium";

export function SpeakerEditCard({ draft, index, date, onChange, onRemove }: Props) {
  return (
    <div className="bg-chalk border border-border rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2.5">
        <span className={LABEL_CLS}>
          Speaker · {String(index + 1).padStart(2, "0")}
        </span>
        <button
          onClick={onRemove}
          className="ml-auto text-walnut-3 hover:text-bordeaux hover:bg-parchment-2 rounded p-1 transition-colors"
          aria-label="Remove speaker"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div role="radiogroup" aria-label="Speaker state" className="grid grid-cols-4 border border-border-strong rounded-md overflow-hidden bg-chalk mb-2.5">
        {SPEAKER_STATUSES.map((s, i) => (
          <button
            key={s}
            role="radio"
            aria-checked={draft.status === s}
            onClick={() => onChange({ status: s })}
            className={cn(
              "font-mono text-[9.5px] uppercase tracking-[0.06em] py-2 text-walnut-2 hover:bg-parchment-2 transition-colors",
              i < SPEAKER_STATUSES.length - 1 && "border-r border-border",
              draft.status === s && STATE_ACTIVE[s],
            )}
          >
            {STATE_LABELS[s]}
          </button>
        ))}
      </div>

      {draft.status === "planned" && (
        <InviteAction
          draft={draft}
          date={date}
          onMarkInvited={() => onChange({ status: "invited" })}
          onPrint={() => printInvitationLetter(
            { name: draft.name, email: draft.email, topic: draft.topic, status: draft.status, role: draft.role },
            date,
          )}
        />
      )}

      <div className="flex flex-col gap-2.5">
        <label className="flex flex-col gap-1">
          <span className={LABEL_CLS}>Name <span className="text-bordeaux">*</span></span>
          <input
            value={draft.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g. Sister Hannah Reeves"
            className={INPUT_CLS}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={LABEL_CLS}>
            Email<span className="text-walnut-3 font-normal normal-case tracking-normal"> — optional</span>
          </span>
          <input
            type="email"
            value={draft.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="name@example.com"
            aria-invalid={draft.email.trim().length > 0 && !isValidEmail(draft.email)}
            className={cn(
              INPUT_CLS,
              draft.email.trim().length > 0 && !isValidEmail(draft.email)
                && "border-bordeaux focus:border-bordeaux focus:ring-bordeaux/25",
            )}
          />
          {draft.email.trim().length > 0 && !isValidEmail(draft.email) && (
            <span className="font-sans text-[11.5px] text-bordeaux mt-0.5">
              Enter a valid email address (e.g. name@example.com).
            </span>
          )}
        </label>
        <label className="flex flex-col gap-1">
          <span className={LABEL_CLS}>
            Topic<span className="text-walnut-3 font-normal normal-case tracking-normal"> — optional</span>
          </span>
          <input
            value={draft.topic}
            onChange={(e) => onChange({ topic: e.target.value })}
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
                className={cn(
                  "font-mono text-[10px] uppercase tracking-[0.12em] px-2.5 py-1.5 rounded-full border transition-colors",
                  draft.role === r
                    ? "bg-walnut text-parchment border-walnut"
                    : "bg-chalk text-walnut-2 border-border-strong hover:bg-parchment-2",
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
