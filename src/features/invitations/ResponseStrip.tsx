import type { SpeakerInvitation } from "@/lib/types";

interface Props {
  response: NonNullable<SpeakerInvitation["response"]>;
  needsApply: boolean;
  applying: boolean;
  onApply: () => void;
  error: string | null;
}

/** Bishop-side strip that surfaces the speaker's Yes/No reply and
 *  offers the single-click Apply-as-{confirmed,declined} action.
 *  Rendered above the chat thread inside BishopInvitationChat. */
export function ResponseStrip({ response, needsApply, applying, onApply, error }: Props) {
  const target = response.answer === "yes" ? "confirmed" : "declined";
  return (
    <div className="px-4 py-3 border-b border-border bg-parchment-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium">
            Response · {response.answer === "yes" ? "Yes" : "No"}
          </span>
          {response.reason && (
            <p className="font-serif italic text-[12.5px] text-walnut-2 mt-0.5">
              "{response.reason}"
            </p>
          )}
        </div>
        {needsApply ? (
          <button
            type="button"
            onClick={onApply}
            disabled={applying}
            className="font-sans text-[12.5px] font-semibold px-3 py-1.5 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment hover:bg-bordeaux-deep disabled:opacity-60 shrink-0"
          >
            {applying ? "Applying…" : `Apply as ${target}`}
          </button>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
            Applied · status is {target}
          </span>
        )}
      </div>
      {error && <p className="font-sans text-[11.5px] text-bordeaux mt-1.5">{error}</p>}
    </div>
  );
}
