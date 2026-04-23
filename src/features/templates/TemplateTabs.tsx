import { cn } from "@/lib/cn";

interface Tab {
  id: string;
  label: string;
}

interface Props {
  tabs: readonly Tab[];
  active: string;
  onChange: (id: string) => void;
}

/** Simple tab strip for the Speaker-invitation template page. Keeps
 *  a monochrome bordeaux underline on the active tab and hands back
 *  changes to the caller so tab state can live in the URL. */
export function TemplateTabs({ tabs, active, onChange }: Props): React.ReactElement {
  return (
    <div
      role="tablist"
      className="inline-flex items-center gap-1 border-b border-border mb-6 -mt-1"
    >
      {tabs.map((t) => {
        const current = t.id === active;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={current}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "font-sans text-[14px] font-semibold px-3 py-2 -mb-px border-b-2 transition-colors",
              current
                ? "border-bordeaux text-bordeaux-deep"
                : "border-transparent text-walnut-3 hover:text-walnut",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
