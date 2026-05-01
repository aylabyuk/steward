import { cn } from "@/lib/cn";

export const AUDIENCE_VALUES = ["speaker", "prayer", "other"] as const;
export type Audience = (typeof AUDIENCE_VALUES)[number];

const TABS: readonly { value: Audience; label: string }[] = [
  { value: "speaker", label: "Speaker" },
  { value: "prayer", label: "Prayer" },
  { value: "other", label: "Other" },
];

interface Props {
  active: Audience;
  onChange: (next: Audience) => void;
}

/** Three-pill tab strip that segments /settings/templates by audience.
 *  Replaces the previous PageRail TOC — three buckets scale better as
 *  the template list grows. URL state is owned by the parent (synced
 *  via `?audience=`); this component just renders + dispatches. */
export function TemplatesAudienceTabs({ active, onChange }: Props): React.ReactElement {
  return (
    <div
      role="tablist"
      aria-label="Templates audience"
      className="flex items-center gap-1 rounded-full border border-border bg-parchment-2/60 p-1 mb-6 w-fit"
    >
      {TABS.map((t) => {
        const selected = t.value === active;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.value)}
            className={cn(
              "rounded-full px-4 py-1.5 font-sans text-[13px] font-semibold transition-colors",
              selected
                ? "bg-walnut text-parchment shadow-[0_1px_0_rgba(35,24,21,0.18)]"
                : "text-walnut-2 hover:bg-parchment-2 hover:text-walnut",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/** Coerce an arbitrary string (typically from `?audience=`) into a
 *  valid Audience, defaulting to "speaker". */
export function parseAudience(raw: string | null | undefined): Audience {
  return AUDIENCE_VALUES.find((v) => v === raw) ?? "speaker";
}
