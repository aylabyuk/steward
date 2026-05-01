import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { letterCanvasToPdf } from "@/features/page-editor/utils/letterToPdf";

/** Global-namespaced bridge function the iOS WebView host invokes
 *  via `evaluateJavaScript`. Returns the rendered letter PDF as a
 *  base64 string (no `data:` URI prefix) so the host can decode
 *  straight into bytes for `UIActivityViewController`.
 *
 *  Names are namespaced with `__ios_` so they're obviously
 *  internal-tooling and won't collide with anything else on the
 *  page. */
declare global {
  interface Window {
    __ios_exportLetterPdf?: () => Promise<string>;
  }
}

const BRIDGE_KEY = "__ios_exportLetterPdf" as const;
const PORTAL_SELECTOR = "[data-print-only-letter]";

/** Installs `window.__ios_exportLetterPdf` while the calling page is
 *  mounted with `?embed=ios`. The function rasterises the existing
 *  `<PrintOnlyLetter>` portal (mounted by both prepare pages) via
 *  the same `letterCanvasToPdf` pipeline the speaker-side
 *  `ShareToolbar` uses, then returns the PDF as base64.
 *
 *  Bridge contract:
 *    - Returns a Promise<string> resolving to a raw base64 PDF.
 *    - Throws (rejects) if the portal isn't on the page yet, or
 *      if html2canvas / jsPDF fail. The iOS host catches and
 *      falls back to a plaintext share via the Transferable
 *      representation cascade.
 *
 *  The hook removes the global on unmount so navigating off the
 *  prepare page leaves no dangling references on `window`. */
export function useEmbedShareBridge(): void {
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get("embed") === "ios";

  useEffect(() => {
    if (!isEmbed) return;
    window[BRIDGE_KEY] = exportLetterPdf;
    return () => {
      if (window[BRIDGE_KEY] === exportLetterPdf) delete window[BRIDGE_KEY];
    };
  }, [isEmbed]);
}

/** Pure exporter — exposed for tests and so the hook's `useEffect`
 *  can install / uninstall by reference rather than recreating the
 *  function on every render. */
export async function exportLetterPdf(): Promise<string> {
  const target = document.querySelector<HTMLElement>(PORTAL_SELECTOR);
  if (!target) {
    throw new Error(`embed share bridge: ${PORTAL_SELECTOR} portal not mounted`);
  }
  const { blob } = await letterCanvasToPdf(target, "letter.pdf");
  return await blobToBase64(blob);
}

/** Encodes a Blob into a raw base64 string (no `data:…;base64,`
 *  prefix). Uses FileReader for streamed handling of large PDFs;
 *  the alternative `btoa(String.fromCharCode(...))` choke-points on
 *  multi-MB letters. */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("error", () => reject(reader.error ?? new Error("FileReader failed")));
    reader.addEventListener("load", () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("FileReader returned non-string"));
        return;
      }
      // result is `data:application/pdf;base64,<...>` — strip the prefix.
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    });
    reader.readAsDataURL(blob);
  });
}
