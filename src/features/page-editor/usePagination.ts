import { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

interface Options {
  /** Distance (CSS px) from one page-content top to the next. Equals
   *  pageH + interpage gap. Pagination jumps blocks across this stride
   *  whenever they would cross a page bottom. */
  pageStride: number;
  /** Usable height (CSS px) of the page content area — the page sheet
   *  height minus its top + bottom margin paddings. */
  pageContentH: number;
  /** Distance (CSS px) from the offset-parent's top edge to the
   *  contenteditable's first natural content row. Used to normalise
   *  every measured `offsetTop` so pagination math runs in
   *  content-relative Y rather than raw stage Y — without this the
   *  pushed blocks would land in the page's top margin instead of its
   *  content top. */
  padTopPx: number;
  /** Ref to the container that holds the contenteditable. Reads its
   *  first `[contenteditable=true]` descendant on every paginate tick
   *  so it works regardless of the wrapping markup. */
  contentRef: React.RefObject<HTMLElement | null>;
}

/** Margin-injection paginator. After every Lexical update, walks the
 *  contenteditable's top-level blocks. Any block whose bottom would
 *  cross its page's content bottom gets `style.marginTop` injected to
 *  push it to the next page's top — so blocks never visually split.
 *  Returns the page count so the host can stack that many `<PageSheet>`
 *  backgrounds.
 *
 *  Limitations: a single block taller than `pageContentH` (e.g. a
 *  pasted 30-paragraph quote) won't paginate — it overflows past its
 *  page bottom. The bishop can split it manually or insert a hard
 *  page break. */
export function usePagination({ pageStride, pageContentH, padTopPx, contentRef }: Options) {
  const [editor] = useLexicalComposerContext();
  const [pages, setPages] = useState(1);

  useEffect(() => {
    let raf = 0;

    function paginate() {
      const editable = contentRef.current?.querySelector(
        '[contenteditable="true"]',
      ) as HTMLElement | null;
      if (!editable) return;
      const blocks = Array.from(editable.children) as HTMLElement[];
      if (blocks.length === 0) {
        setPages(1);
        return;
      }

      // Step 1: clear margins we previously injected so we measure
      // natural positions, not stale pushed ones.
      for (const b of blocks) {
        if (b.dataset.pgInjected === "1") {
          b.style.marginTop = "";
          delete b.dataset.pgInjected;
        }
      }
      void editable.offsetHeight; // force reflow before measuring

      // Step 2: walk and inject. Each block's normalized Y is
      // (offsetTop − padTopPx) so Y=0 is the first page's content
      // top, which makes `Math.floor(top / pageStride)` directly
      // correspond to the page index.
      //
      // Subtle: setting `style.marginTop` REPLACES the block's natural
      // margin (headings / quote / list inherit margin-top from
      // `.prose`). So to move a block visually by `delta`, we have to
      // set `naturalMt + delta`, otherwise headings push as if their
      // natural 2em margin never existed and they land that much
      // *above* the next page's content top — inside the top margin.
      for (const b of blocks) {
        const top = b.offsetTop - padTopPx;
        const bottom = top + b.offsetHeight;
        const pageIdx = Math.floor(top / pageStride);
        const pageContentBottom = pageIdx * pageStride + pageContentH;
        if (bottom > pageContentBottom && b.offsetHeight <= pageContentH) {
          const nextTop = (pageIdx + 1) * pageStride;
          const naturalMt = parseFloat(getComputedStyle(b).marginTop) || 0;
          b.style.marginTop = `${nextTop - top + naturalMt}px`;
          b.dataset.pgInjected = "1";
          void editable.offsetHeight;
        }
      }

      const last = blocks[blocks.length - 1]!;
      const lastBottom = last.offsetTop - padTopPx + last.offsetHeight;
      setPages(Math.max(1, Math.floor(lastBottom / pageStride) + 1));
    }

    function schedule() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(paginate);
    }

    schedule();
    const unregister = editor.registerUpdateListener(schedule);
    window.addEventListener("resize", schedule);
    return () => {
      unregister();
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(raf);
    };
  }, [editor, pageStride, pageContentH, padTopPx, contentRef]);

  return pages;
}
