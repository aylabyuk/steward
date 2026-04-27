import html2canvas from "html2canvas";
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
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    width: PAGE_W_PX,
    windowWidth: PAGE_W_PX,
  });

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
