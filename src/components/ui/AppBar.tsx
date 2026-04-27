import { useEffect, useRef } from "react";
import { Link } from "@/lib/nav";

interface Props {
  /** Optional small uppercase label above the title — e.g. "Your
   *  account", "Ward administration". */
  eyebrow?: string;
  title: string;
  /** Optional italic blurb under the title. */
  description?: string;
  /** Where the back link points. Defaults to /schedule. */
  backTo?: string;
  /** Label for the back link. Defaults to "Schedule". */
  backLabel?: string;
}

/** Sliver-style app bar — large hero at the top with eyebrow, title,
 *  and description; a compact 48px bar with the back arrow + small
 *  centered title pinned above it.
 *
 *  The hero is in normal flow and scrolls naturally with the page;
 *  only the compact bar is sticky. As the hero scrolls under the
 *  compact bar, the small title fades in (and the hairline beneath
 *  the bar fades in too). Because we only animate `opacity` — no
 *  height, no transforms — every frame is GPU-composited and the
 *  scroll stays smooth.
 *
 *  A 0-height sentinel placed just after the hero drives the fade.
 *  Its viewport-relative position vs. the compact bar's bottom edge
 *  gives us a continuous progress value, updated inside a
 *  rAF-throttled scroll handler. */
const FADE_RANGE_PX = 36;

export function AppBar({
  eyebrow,
  title,
  description,
  backTo = "/schedule",
  backLabel = "Schedule",
}: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const compactTitleRef = useRef<HTMLHeadingElement>(null);
  const hairlineRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    const compactTitle = compactTitleRef.current;
    const hairline = hairlineRef.current;
    const sentinel = sentinelRef.current;
    if (!bar || !compactTitle || !hairline || !sentinel) return;

    const scroller = findScrollContainer(sentinel);
    let raf = 0;

    const update = () => {
      raf = 0;
      const sentinelTop = sentinel.getBoundingClientRect().top;
      const barBottom = bar.getBoundingClientRect().bottom;
      // distance > 0 → sentinel below the bar (hero still visible).
      // distance < 0 → sentinel above the bar (hero scrolled out).
      const distance = sentinelTop - barBottom;
      const progress = clamp01(-distance / FADE_RANGE_PX);
      compactTitle.style.opacity = String(progress);
      hairline.style.opacity = String(progress);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* Compact bar — only this element is sticky. */}
      <div ref={barRef} className="sticky top-0 z-20 bg-parchment/85 backdrop-blur-sm">
        <div className="w-full max-w-380 mx-auto px-4 sm:px-8">
          <div className="relative flex items-center h-12">
            <Link
              to={backTo}
              className="inline-flex items-center gap-1.5 text-[13px] text-walnut-2 hover:text-walnut transition-colors shrink-0"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              {backLabel}
            </Link>
            <h2
              ref={compactTitleRef}
              aria-hidden="true"
              style={{ opacity: 0 }}
              className="absolute left-1/2 -translate-x-1/2 max-w-[60%] truncate font-display text-[15px] font-semibold text-walnut will-change-[opacity]"
            >
              {title}
            </h2>
          </div>
        </div>
        <div
          ref={hairlineRef}
          aria-hidden
          style={{ opacity: 0 }}
          className="absolute inset-x-0 bottom-0 h-px bg-border pointer-events-none will-change-[opacity]"
        />
      </div>

      {/* Hero — sits in normal flow; scrolls under the sticky bar. */}
      <div className="w-full max-w-380 mx-auto px-4 sm:px-8 pt-1 pb-5">
        {eyebrow && (
          <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep font-medium mt-1 mb-1.5">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-[1.75rem] sm:text-[2.25rem] font-semibold text-walnut leading-tight">
          {title}
        </h1>
        {description && (
          <p className="font-serif italic text-[14.5px] sm:text-[16px] text-walnut-2 mt-1">
            {description}
          </p>
        )}
      </div>
      <div ref={sentinelRef} aria-hidden className="h-0" />
    </>
  );
}

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function findScrollContainer(start: HTMLElement): HTMLElement | Window {
  let el: HTMLElement | null = start.parentElement;
  while (el) {
    const overflow = getComputedStyle(el).overflowY;
    if (overflow === "auto" || overflow === "scroll") return el;
    el = el.parentElement;
  }
  return window;
}
