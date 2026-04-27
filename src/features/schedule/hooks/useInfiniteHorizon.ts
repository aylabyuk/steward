import { useEffect, useRef, useState } from "react";

interface Options {
  /** First load — number of weeks rendered immediately. */
  initial: number;
  /** How many additional weeks to pull in each time the sentinel
   *  enters view. */
  step: number;
  /** Hard ceiling. Once `weeks >= max`, the observer disconnects and
   *  scroll won't trigger more loads. */
  max: number;
}

interface Result {
  weeks: number;
  /** Attach to a sentinel element rendered just below the bottom of
   *  the list. Once the sentinel scrolls into view (with a 200px
   *  pre-roll), the horizon grows by `step`. */
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

/** Scroll-driven horizon for the mobile schedule. The user has no
 *  HorizonSelect on a phone — the list starts at `initial` weeks and
 *  grows by `step` each time they scroll near the bottom, capped at
 *  `max`. Pass `enabled: false` (i.e. on desktop) to short-circuit the
 *  IntersectionObserver entirely so the desktop path stays static. */
export function useInfiniteHorizon(enabled: boolean, options: Options): Result {
  const [weeks, setWeeks] = useState(options.initial);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || weeks >= options.max) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setWeeks((w) => Math.min(w + options.step, options.max));
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [enabled, weeks, options.step, options.max]);

  return { weeks, sentinelRef };
}
