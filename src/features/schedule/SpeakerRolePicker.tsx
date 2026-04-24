import { SPEAKER_ROLES, type SpeakerRole } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  role: SpeakerRole;
  readOnly: boolean;
  onChange: (role: SpeakerRole) => void;
}

const LABEL_CLS = "font-mono text-[9.5px] uppercase tracking-[0.14em] text-brass-deep font-medium";

/** Small pill row for picking a speaker role (Bishopric / Member /
 *  Youth / Primary). Extracted out of SpeakerEditCard to keep that
 *  file under the 150-LOC cap. Disabled in step-2 read-only mode;
 *  selected pill keeps its active styling at reduced opacity so the
 *  role stays legible. */
export function SpeakerRolePicker({ role, readOnly, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={LABEL_CLS}>Role</span>
      <div className="flex flex-wrap gap-1.5">
        {SPEAKER_ROLES.map((r) => (
          <button
            key={r}
            onClick={() => onChange(r)}
            disabled={readOnly}
            className={cn(
              "font-mono text-[10px] uppercase tracking-[0.12em] px-2.5 py-1.5 rounded-full border transition-colors disabled:cursor-not-allowed",
              role === r
                ? "bg-walnut text-parchment border-walnut disabled:opacity-80"
                : "bg-chalk text-walnut-2 border-border-strong hover:bg-parchment-2 disabled:opacity-60 disabled:hover:bg-chalk",
            )}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
