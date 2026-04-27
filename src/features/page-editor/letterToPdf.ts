import html2canvas from "html2canvas-pro";
import { jsPDF as JsPDF } from "jspdf";

const PAGE_W_IN = 8.5;
const PAGE_H_IN = 11;
const DPI = 96;
const PAGE_W_PX = PAGE_W_IN * DPI;

/** Snapshot a rendered LetterCanvas DOM subtree into a paginated PDF.
 *  Targets the existing `[data-print-only-letter]` portal (already
 *  mounted at true 8.5 × 11 with chips + vars baked in), so the PDF
 *  matches the on-screen design pixel-for-pixel.
 *
 *  Image-based PDF: html2canvas rasterises the subtree, then we slice
 *  the canvas into 11"-tall pages and embed each slice on a fresh
 *  jsPDF page. Selectable text isn't preserved — we accept that for
 *  simplicity; the share path is a hand-delivery alternative, not a
 *  long-term archival format. */
export async function letterCanvasToPdf(
  el: HTMLElement,
  filename: string,
): Promise<{ blob: Blob; file: File }> {
  // The PrintOnlyLetter portal is `display: none` on screen so the
  // print path can rely on it (see styles/index.css). html2canvas
  // would otherwise snapshot a 0-by-0 canvas and the slice drawImage
  // would throw "image argument is a canvas element with a width or
  // height of 0". Park it off-screen for the duration of the capture
  // so it lays out at full 8.5×11 without flashing on the user.
  const restore = unhideOffscreen(el);
  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      width: PAGE_W_PX,
      windowWidth: PAGE_W_PX,
    });
  } finally {
    restore();
  }

  const pxPerInch = canvas.width / PAGE_W_IN;
  const pageHeightPx = pxPerInch * PAGE_H_IN;
  const pages = Math.max(1, Math.ceil(canvas.height / pageHeightPx));

  const pdf = new JsPDF({ unit: "in", format: "letter", orientation: "portrait" });

  for (let i = 0; i < pages; i++) {
    const sliceY = i * pageHeightPx;
    const sliceH = Math.min(pageHeightPx, canvas.height - sliceY);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceH;
    const ctx = slice.getContext("2d");
    if (!ctx) throw new Error("PDF generation failed: 2D context unavailable.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, -sliceY);
    const imgData = slice.toDataURL("image/jpeg", 0.92);
    if (i > 0) pdf.addPage();
    const renderedHIn = sliceH / pxPerInch;
    pdf.addImage(imgData, "JPEG", 0, 0, PAGE_W_IN, renderedHIn);
  }

  const blob = pdf.output("blob");
  const file = new File([blob], filename, { type: "application/pdf" });
  return { blob, file };
}

const OFFSCREEN_STYLES = {
  display: "block",
  position: "fixed",
  top: "0",
  left: "-100000px",
  visibility: "visible",
  pointerEvents: "none",
} as const;

function unhideOffscreen(el: HTMLElement): () => void {
  const previous: Record<string, string> = {};
  for (const key of Object.keys(OFFSCREEN_STYLES) as (keyof typeof OFFSCREEN_STYLES)[]) {
    previous[key] = el.style.getPropertyValue(camelToKebab(key));
    el.style.setProperty(camelToKebab(key), OFFSCREEN_STYLES[key], "important");
  }
  return () => {
    for (const key of Object.keys(previous)) {
      const prop = camelToKebab(key);
      const prev = previous[key];
      if (prev) el.style.setProperty(prop, prev);
      else el.style.removeProperty(prop);
    }
  };
}

function camelToKebab(s: string): string {
  return s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}
