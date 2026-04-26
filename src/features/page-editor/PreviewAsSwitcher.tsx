import { useEffect, useRef, useState } from "react";
import { useWardMembers } from "@/hooks/useWardMembers";
import { LETTER_VARIABLE_SAMPLES } from "./letterVariables";

export interface PreviewVars {
  speakerName: string;
  topic: string;
  date: string;
  wardName: string;
  inviterName: string;
  today: string;
}

interface Props {
  /** Real ward name (passed in from useWardSettings) so the
   *  "Sample" option already feels grounded. */
  wardName: string;
  /** Current bishop's display name so the inviterName preview
   *  matches whoever's authoring. */
  inviterName: string;
  /** Resolved vars bag handed back to the editor. The host wires
   *  it through LetterPageEditor → LetterRenderContextProvider. */
  onChange: (vars: PreviewVars) => void;
}

const SAMPLE_LABEL = "Sample (Brother Park)";

/** Header dropdown that demonstrates {{variable}} substitution by
 *  swapping the editor's preview-vars bag between the static sample
 *  and any active ward member. The bishop sees "Brother Park"
 *  literally change to "Sister Reeves" inside every chip — best
 *  signal we can give that those words are dynamic. */
export function PreviewAsSwitcher({ wardName, inviterName, onChange }: Props) {
  const members = useWardMembers();
  const [open, setOpen] = useState(false);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Outside-click dismiss to match the rest of the popovers.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const activeMembers = (members.data ?? [])
    .filter((m) => m.data.active)
    .sort((a, b) => a.data.displayName.localeCompare(b.data.displayName));

  const selected = activeMembers.find((m) => m.id === selectedUid) ?? null;
  const label = selected ? selected.data.displayName : SAMPLE_LABEL;

  // Re-emit whenever the resolved bag changes. wardName / inviterName
  // changes from props ride through too — the host always reflects
  // real ward + bishop info even on the Sample option.
  // biome-ignore lint/correctness/useExhaustiveDependencies: onChange
  // is a new function ref each render in the host; tracking it would
  // re-fire constantly. We treat it as stable by convention.
  useEffect(() => {
    const speakerName = selected?.data.displayName ?? LETTER_VARIABLE_SAMPLES["speakerName"]!;
    onChange({
      speakerName,
      topic: LETTER_VARIABLE_SAMPLES["topic"]!,
      date: LETTER_VARIABLE_SAMPLES["date"]!,
      today: LETTER_VARIABLE_SAMPLES["today"]!,
      wardName: wardName || LETTER_VARIABLE_SAMPLES["wardName"]!,
      inviterName: inviterName || LETTER_VARIABLE_SAMPLES["inviterName"]!,
    });
  }, [selected, wardName, inviterName]);

  return (
    <div ref={ref} style={{ position: "relative" }} className="hidden sm:inline-flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseDown={(e) => e.preventDefault()}
        className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-chalk px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-walnut-2 hover:bg-parchment-2"
      >
        <span aria-hidden className="text-brass-deep">
          ▸
        </span>
        Preview as: <span className="text-walnut">{label}</span>
        <span aria-hidden className="text-walnut-3">
          ▾
        </span>
      </button>
      {open && (
        <div
          className="absolute top-[calc(100%+6px)] right-0 z-30 min-w-[240px] max-h-[360px] overflow-y-auto rounded-lg border border-border-strong bg-chalk shadow-elev-3 p-1"
          onMouseDown={(e) => e.preventDefault()}
        >
          <PreviewOption
            label={SAMPLE_LABEL}
            sub="Static sample values"
            active={!selected}
            onClick={() => {
              setSelectedUid(null);
              setOpen(false);
            }}
          />
          {activeMembers.length > 0 && (
            <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-brass-deep px-3 pt-3 pb-1.5">
              Ward members
            </div>
          )}
          {activeMembers.map((m) => (
            <PreviewOption
              key={m.id}
              label={m.data.displayName}
              sub={m.data.email || ""}
              active={selected?.id === m.id}
              onClick={() => {
                setSelectedUid(m.id);
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewOption({
  label,
  sub,
  active,
  onClick,
}: {
  label: string;
  sub: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      className={`w-full text-left flex flex-col gap-0.5 px-3 py-2 rounded-md hover:bg-parchment-2 ${active ? "bg-bordeaux/10 text-bordeaux-deep" : "text-walnut"}`}
    >
      <span className="font-sans text-[13px]">{label}</span>
      {sub && <span className="font-mono text-[10px] text-walnut-3">{sub}</span>}
    </button>
  );
}
