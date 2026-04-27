import { useMemo, useState } from "react";
import type { PrayerParticipant, PrayerRole } from "@/lib/types";
import type { WithId } from "@/hooks/_sub";
import { PrayerActionPicker, type PrayerActionMode } from "./PrayerActionPicker";
import { ReviewPrayerLetterStep } from "./ReviewPrayerLetterStep";

const ROLE_ORDER: PrayerRole[] = ["opening", "benediction"];
const ROLE_HEADING: Record<PrayerRole, string> = {
  opening: "Opening prayer",
  benediction: "Benediction",
};

interface Props {
  wardId: string;
  date: string;
  /** Active prayer participants (pulled from the prayers/{role}
   *  subcollection by the parent wizard). The step skips slots that
   *  have no name set — Roster step would have already filtered. */
  participants: WithId<PrayerParticipant>[];
  loading: boolean;
  onBackToRoster: () => void;
  onDone: () => void;
}

type SubStep = "pick" | "review";

/** Mirror of `InvitationStep` for prayer-givers. Iterates through
 *  the active prayer participants in fixed role order (Opening →
 *  Benediction). Each participant goes through the same sub-step
 *  flow as a speaker: action picker → letter review. */
export function PrayerInvitationStep({
  wardId,
  date,
  participants,
  loading,
  onBackToRoster,
  onDone,
}: Props) {
  const ordered = useMemo(
    () =>
      ROLE_ORDER.flatMap((role) => participants.filter((p) => p.data.role === role)).filter((p) =>
        p.data.name?.trim(),
      ),
    [participants],
  );
  const [index, setIndex] = useState(0);
  const [subStep, setSubStep] = useState<SubStep>("pick");
  const [mode, setMode] = useState<PrayerActionMode>("send");

  if (loading && ordered.length === 0) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl w-full mx-auto px-5 sm:px-8 py-5">
          <p className="font-serif italic text-walnut-2">Loading prayer-givers…</p>
        </div>
      </div>
    );
  }
  if (ordered.length === 0) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl w-full mx-auto px-5 sm:px-8 py-5 flex flex-col gap-3">
          <p className="font-serif italic text-walnut-2">No prayer-givers yet.</p>
          <button
            type="button"
            onClick={onBackToRoster}
            className="self-start rounded-md border border-border-strong bg-chalk px-3 py-1.5 font-sans text-[13px] font-semibold text-walnut hover:bg-parchment-2"
          >
            ← Back to roster
          </button>
        </div>
      </div>
    );
  }

  const current = ordered[Math.min(index, ordered.length - 1)]!;
  const total = ordered.length;

  function advance() {
    setSubStep("pick");
    if (index >= total - 1) onDone();
    else setIndex((i) => i + 1);
  }
  function backFromPick() {
    if (index === 0) onBackToRoster();
    else {
      setIndex((i) => i - 1);
      setSubStep("pick");
    }
  }

  const pct = ((index + 1) / total) * 100;
  const progress = (
    <div className="shrink-0 px-5 sm:px-8 pt-5 pb-3">
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[20px] sm:text-[22px] font-semibold text-walnut leading-none">
              {ROLE_HEADING[current.data.role]}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-walnut-3">
              {index + 1} of {total}
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-walnut-3">
            {index + 1}/{total}
          </span>
        </div>
        <div className="h-1.5 w-full bg-parchment-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-walnut transition-all"
            style={{ width: `${pct}%` }}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {progress}
      {subStep === "pick" ? (
        <PrayerActionPicker
          role={current.data.role}
          participant={current.data}
          wardId={wardId}
          date={date}
          onPick={(picked) => {
            setMode(picked);
            setSubStep("review");
          }}
          onSkip={advance}
          onBack={backFromPick}
        />
      ) : (
        <ReviewPrayerLetterStep
          wardId={wardId}
          date={date}
          role={current.data.role}
          participant={current.data}
          mode={mode}
          onBack={() => setSubStep("pick")}
          onComplete={advance}
        />
      )}
    </div>
  );
}
