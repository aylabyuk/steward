/* localStorage helpers for the program-templates panel layout —
 * editor width + which side the preview sits on. Centralised here so
 * the panel component stays under the 150-LOC cap. */

const WIDTH_KEY = "steward.programTemplates.editorWidth";
const SIDE_KEY = "steward.programTemplates.previewSide";

export const DEFAULT_EDITOR_WIDTH = 448;
export const MIN_EDITOR_WIDTH = 320;
export const MIN_PREVIEW_WIDTH = 360;

export type PreviewSide = "left" | "right";

export function readStoredWidth(): number {
  if (typeof window === "undefined") return DEFAULT_EDITOR_WIDTH;
  try {
    const raw = window.localStorage.getItem(WIDTH_KEY);
    const n = raw ? Number.parseInt(raw, 10) : Number.NaN;
    return Number.isFinite(n) ? n : DEFAULT_EDITOR_WIDTH;
  } catch {
    return DEFAULT_EDITOR_WIDTH;
  }
}

export function writeStoredWidth(value: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WIDTH_KEY, String(value));
  } catch {
    /* localStorage unavailable — preference doesn't persist, fine. */
  }
}

export function readStoredSide(): PreviewSide {
  if (typeof window === "undefined") return "right";
  try {
    const raw = window.localStorage.getItem(SIDE_KEY);
    return raw === "left" ? "left" : "right";
  } catch {
    return "right";
  }
}

export function writeStoredSide(value: PreviewSide): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SIDE_KEY, value);
  } catch {
    /* localStorage unavailable — preference doesn't persist, fine. */
  }
}
