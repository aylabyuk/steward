import { useEffect, useState } from "react";
import { Link } from "react-router";
import { cn } from "@/lib/cn";

interface RailItem {
  id: string;
  label: string;
}

interface Props {
  items: readonly RailItem[];
  /** "Elsewhere" links below the on-page jump list. */
  elsewhere?: readonly { to: string; label: string }[];
}

/** Sticky right-rail with scroll-spy. Hidden below sm:. Active item
 *  is whichever section has its top above the scroll threshold —
 *  matches the prototype's 140px cutoff so the rail flips as a
 *  section's title crosses the sticky topbar. */
export function ProfileRail({ items, elsewhere }: Props): React.ReactElement {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    if (items.length === 0) return;
    function onScroll() {
      let cur = items[0]?.id ?? "";
      for (const s of items) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top < 140) cur = s.id;
      }
      setActive(cur);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  return (
    <nav
      aria-label="Profile sections"
      className="hidden sm:flex sticky top-[5.5rem] flex-col gap-0.5 self-start"
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep px-2.5 pt-1 pb-2">
        On this page
      </div>
      {items.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md border-l-2 -ml-0.5 text-[13.5px] transition-colors",
            active === s.id
              ? "border-bordeaux text-bordeaux-deep font-semibold bg-parchment-2/40"
              : "border-transparent text-walnut-2 hover:bg-parchment-2 hover:text-walnut",
          )}
        >
          {s.label}
        </a>
      ))}
      {elsewhere && elsewhere.length > 0 && (
        <>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep px-2.5 pt-4 pb-2">
            Elsewhere
          </div>
          {elsewhere.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-2 px-3 py-2 rounded-md border-l-2 -ml-0.5 border-transparent text-[13.5px] text-walnut-2 hover:bg-parchment-2 hover:text-walnut transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </>
      )}
    </nav>
  );
}
