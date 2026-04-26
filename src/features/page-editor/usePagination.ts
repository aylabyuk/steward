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
export function usePagination({ pageStride, pageContentH, contentRef }: Options) {
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

      // Step 2: walk and inject. Since each push re-flows everything
      // below it, we re-read offsetTop after each injection.
      for (const b of blocks) {
        const top = b.offsetTop;
        const bottom = top + b.offsetHeight;
        const pageIdx = Math.floor(top / pageStride);
        const pageContentBottom = pageIdx * pageStride + pageContentH;
        if (bottom > pageContentBottom && b.offsetHeight <= pageContentH) {
          const nextTop = (pageIdx + 1) * pageStride;
          b.style.marginTop = `${nextTop - top}px`;
          b.dataset.pgInjected = "1";
          void editable.offsetHeight;
        }
      }

      const last = blocks[blocks.length - 1]!;
      const lastBottom = last.offsetTop + last.offsetHeight;
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
  }, [editor, pageStride, pageContentH, contentRef]);

  return pages;
}
