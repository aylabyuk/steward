import type { Hymn, MidItem as MidItemType } from "@/lib/types";
import { HymnPicker } from "@/features/hymns/HymnPicker";
import { cn } from "@/lib/cn";

interface Props {
  mid: MidItemType | undefined;
  onChange: (next: MidItemType) => void;
}

const DEFAULT_MID: MidItemType = {
  mode: "none",
  rest: null,
  musical: null,
  midAfter: 1,
};

const MODES = [
  { key: "rest" as const, label: "Rest hymn" },
  { key: "musical" as const, label: "Musical number" },
  { key: "none" as const, label: "None" },
];

export function MidItem({ mid, onChange }: Props) {
  const m = mid ?? DEFAULT_MID;

  function setMode(mode: MidItemType["mode"]) {
    onChange({ ...m, mode });
  }

  function setRest(h: Hymn | null) {
    onChange({ ...m, rest: h });
  }

  function setPerformer(performer: string) {
    onChange({ ...m, musical: { performer } });
  }

  return (
    <div className="bg-parchment-2 border border-border rounded-lg px-3 py-2.5 my-1.5">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep">
          Between sacrament &amp; speakers
        </span>
        <div className="ml-auto inline-flex bg-chalk border border-border-strong rounded-md p-0.5">
          {MODES.map((mode) => (
            <button
              key={mode.key}
              type="button"
              onClick={() => setMode(mode.key)}
              className={cn(
                "font-mono text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded-sm transition-colors",
                m.mode === mode.key ? "bg-walnut text-parchment" : "text-walnut-2 hover:bg-parchment-2",
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
      {m.mode === "rest" && (
        <HymnPicker
          label="Rest hymn"
          hymn={m.rest ?? null}
          placeholder="Pick a hymn"
          onChange={setRest}
        />
      )}
      {m.mode === "musical" && (
        <div className="grid grid-cols-[86px_minmax(0,1fr)] items-center gap-3 py-1">
          <div className="text-[13.5px] font-sans font-medium text-walnut-2">Performer</div>
          <input
            value={m.musical?.performer ?? ""}
            onChange={(e) => setPerformer(e.target.value)}
            placeholder="e.g. Primary chorus"
            className="font-sans text-[14px] px-2.5 py-1.5 bg-chalk border border-transparent rounded-md text-walnut w-full transition-colors placeholder:text-walnut-3 placeholder:italic hover:border-border-strong focus:outline-none focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/15"
          />
        </div>
      )}
      {m.mode === "none" && (
        <p className="font-serif italic text-[12.5px] text-walnut-3 mt-1 mb-0.5">
          Nothing planned between the sacrament and speakers.
        </p>
      )}
    </div>
  );
}
