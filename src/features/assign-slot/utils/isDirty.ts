import type { AssignSeed } from "../types";

/** Field-by-field compare of the in-progress draft against the seed.
 *  Status is excluded — it has its own audit-stamping write path
 *  (onStatusChange persists immediately) and isn't part of the form's
 *  Save / Continue payload, so flipping it shouldn't make the form
 *  read as "unsaved". */
export function isDirty(draft: AssignSeed, seed: AssignSeed): boolean {
  if (draft.kind === "speaker" && seed.kind === "speaker") {
    return (
      draft.name !== seed.name ||
      draft.topic !== seed.topic ||
      draft.role !== seed.role ||
      draft.email !== seed.email ||
      draft.phone !== seed.phone
    );
  }
  if (draft.kind === "prayer" && seed.kind === "prayer") {
    return draft.name !== seed.name || draft.email !== seed.email || draft.phone !== seed.phone;
  }
  return false;
}
