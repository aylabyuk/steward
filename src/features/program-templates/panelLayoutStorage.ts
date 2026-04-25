/* localStorage helpers for the editor / preview panel layout —
 * editor width + which side the preview sits on. Generic over a
 * namespace so each editor page (program templates, speaker letter,
 * future others) keeps its own preferences. */

export const DEFAULT_EDITOR_WIDTH = 448;
export const MIN_EDITOR_WIDTH = 320;
export const MIN_PREVIEW_WIDTH = 360;

export type PreviewSide = "left" | "right";

const widthKey = (ns: string) => `steward.${ns}.editorWidth`;
const sideKey = (ns: string) => `steward.${ns}.previewSide`;

export function readStoredWidth(namespace: string): number {
  if (typeof window === "undefined") return DEFAULT_EDITOR_WIDTH;
  try {
    const raw = window.localStorage.getItem(widthKey(namespace));
    const n = raw ? Number.parseInt(raw, 10) : Number.NaN;
    return Number.isFinite(n) ? n : DEFAULT_EDITOR_WIDTH;
  } catch {
    return DEFAULT_EDITOR_WIDTH;
  }
}

export function writeStoredWidth(namespace: string, value: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(widthKey(namespace), String(value));
  } catch {
    /* localStorage unavailable — preference doesn't persist, fine. */
  }
}

export function readStoredSide(namespace: string): PreviewSide {
  if (typeof window === "undefined") return "right";
  try {
    const raw = window.localStorage.getItem(sideKey(namespace));
    return raw === "left" ? "left" : "right";
  } catch {
    return "right";
  }
}

export function writeStoredSide(namespace: string, value: PreviewSide): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(sideKey(namespace), value);
  } catch {
    /* localStorage unavailable — preference doesn't persist, fine. */
  }
}
