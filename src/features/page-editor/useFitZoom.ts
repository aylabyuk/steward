import { useEffect, useState } from "react";
import { PAGE_SIZE_INCHES, type LetterPageStyle } from "@/lib/types/template";

const DPI = 96;

interface Result {
  /** Zoom factor that makes the page width exactly fill the stage's
   *  visible width (minus a small breathing margin so the shadow
   *  doesn't kiss the scroll edges). */
  fitWidth: number;
  /** Zoom factor that makes one whole page fit inside the visible
   *  stage area without scroll — limited by either width or height,
   *  whichever is tighter. */
  fitPage: number;
}

/** Computes Fit-Width / Fit-Page zoom factors against a live container
 *  ref. Caller usually passes the ref of the stage's scroll viewport;
 *  we observe its size and recompute on every resize so the host can
 *  re-apply the value when the user is in fit mode. */
export function useFitZoom(
  scrollRef: React.RefObject<HTMLElement | null>,
  pageStyle: LetterPageStyle | null | undefined,
): Result {
  const size = PAGE_SIZE_INCHES[pageStyle?.pageSize ?? "letter"];
  const landscape = (pageStyle?.orientation ?? "portrait") === "landscape";
  const widthIn = landscape ? size.height : size.width;
  const heightIn = landscape ? size.width : size.height;

  const [result, setResult] = useState<Result>({ fitWidth: 1, fitPage: 1 });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth - 64; // breathing room for shadow + scrollbar
      const h = el.clientHeight - 64;
      if (w <= 0 || h <= 0) return;
      const pageWPx = widthIn * DPI;
      const pageHPx = heightIn * DPI;
      const fitWidth = Math.max(0.25, Math.min(2.5, +(w / pageWPx).toFixed(2)));
      const fitPage = Math.max(0.25, Math.min(2.5, +Math.min(w / pageWPx, h / pageHPx).toFixed(2)));
      setResult({ fitWidth, fitPage });
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, [scrollRef, widthIn, heightIn]);

  return result;
}
