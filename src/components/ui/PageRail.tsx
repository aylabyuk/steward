import { useEffect, useState } from "react";
import { Link } from "@/lib/nav";
import { cn } from "@/lib/cn";

interface RailItem {
  id: string;
  label: string;
  /** Optional numeric badge rendered at the end of the row — used on
   *  the Ward settings rail for the member count. */
  count?: number;
  /** Optional group label. When two consecutive items carry different
   *  group strings, a brass-deep header renders between them. Used on
   *  the Templates page to separate invitation / receipts / replies. */
  group?: string;
}

interface Props {
  items: readonly RailItem[];
  /** "Elsewhere" links below the on-page jump list. */
  elsewhere?: readonly { to: string; label: string }[];
  /** aria-label for the nav element — defaults to a generic value. */
  label?: string;
}

/** Sticky right-rail with scroll-spy. Hidden below sm:. Active item
 *  is whichever section has its top above the scroll threshold —
 *  matches the prototype's 140px cutoff so the rail flips as a
 *  section's title crosses the sticky topbar. Shared between the
 *  Profile and Ward-settings pages. */
export function PageRail({ items, elsewhere, label = "Page sections" }: Props): React.ReactElement {
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
      aria-label={label}
      className="hidden sm:flex sticky top-[5.5rem] flex-col gap-0.5 self-start"
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep px-2.5 pt-1 pb-2">
        On this page
      </div>
      {items.map((s, idx) => {
        const prevGroup = idx > 0 ? items[idx - 1]?.group : undefined;
        const showGroupHeader = s.group !== undefined && s.group !== prevGroup;
        return (
          <div key={s.id} className="contents">
            {showGroupHeader && (
              <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-walnut-3 px-2.5 pt-3 pb-1">
                {s.group}
              </div>
            )}
            <a
              href={`#${s.id}`}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md border-l-2 -ml-0.5 text-[13.5px] transition-colors",
                active === s.id
                  ? "border-bordeaux text-bordeaux-deep font-semibold bg-parchment-2/40"
                  : "border-transparent text-walnut-2 hover:bg-parchment-2 hover:text-walnut",
              )}
            >
              <span className="flex-1">{s.label}</span>
              {typeof s.count === "number" && (
                <span className="font-mono text-[10px] tracking-[0.08em] text-walnut-3">
                  {s.count}
                </span>
              )}
            </a>
          </div>
        );
      })}
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
