import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export interface RailSection {
  id: string;
  label: string;
  done?: boolean;
  count?: number;
}

interface Props {
  sections: readonly RailSection[];
}

/**
 * Right-side jump nav for the Program page. Desktop only (hidden below 900px
 * via the parent layout). Uses scroll-spy to highlight the section currently
 * near the top of the viewport.
 */
export function ProgramRail({ sections }: Props) {
  const [active, setActive] = useState<string>(sections[0]?.id ?? "");

  useEffect(() => {
    function onScroll() {
      let current = sections[0]?.id ?? "";
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top < 140) current = s.id;
      }
      setActive(current);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sections]);

  return (
    <nav aria-label="Program sections" className="hidden lg:flex flex-col gap-0.5 p-1">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep px-2.5 pt-1.5 pb-2">
        In this program
      </div>
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={cn(
            "grid grid-cols-[14px_1fr_auto] items-center gap-2.5 px-2.5 py-1.5 rounded-md font-sans text-[13px] transition-colors border-l-2 -ml-0.5",
            active === s.id
              ? "text-bordeaux-deep font-semibold border-bordeaux bg-parchment-2/50"
              : "text-walnut-2 border-transparent hover:bg-parchment-2 hover:text-walnut",
          )}
        >
          <span
            className={cn(
              "w-2 h-2 rounded-full border",
              s.done ? "bg-success border-success" : "border-walnut-3",
            )}
          />
          <span>{s.label}</span>
          {s.count != null && (
            <span className="font-mono text-[10px] text-walnut-3">{s.count}</span>
          )}
        </a>
      ))}
    </nav>
  );
}
