/** Floor for visible speaker rows on a Sunday card — the typical
 *  ward floor. Below this, empty rows render as "Assign Speaker"
 *  placeholders so a fresh card invites action rather than reading
 *  as a single lonely row. */
export const SPEAKER_SLOT_FLOOR = 2;

/** Ceiling for visible speaker rows. Once the assigned count reaches
 *  this, the "Add another speaker" affordance disappears and the
 *  card stops growing. Mirrors the iOS app's `maxSpeakerSlots = 4`. */
export const SPEAKER_SLOT_CEILING = 4;

/** Whether to render the explicit "Add another speaker" affordance
 *  below the last filled row. Only true when the assigned count is
 *  at or above the floor (so empty placeholder rows aren't already
 *  serving as the add invitation) AND below the ceiling (so there's
 *  room to add another). Mirrors `Speaker.canAddMore` on iOS. */
export function canAddAnotherSpeaker(
  assignedCount: number,
  floor: number = SPEAKER_SLOT_FLOOR,
  ceiling: number = SPEAKER_SLOT_CEILING,
): boolean {
  return assignedCount >= floor && assignedCount < ceiling;
}

/** How many empty placeholder rows to render below the actual
 *  speakers so the card meets the floor. Returns 0 once the assigned
 *  count is at or above the floor — the card grows naturally beyond
 *  that, capped only by the ceiling via the add affordance.
 *  Mirrors `Speaker.slots(items, minSlotCount: 2)` on iOS. */
export function speakerPlaceholderCount(
  assignedCount: number,
  floor: number = SPEAKER_SLOT_FLOOR,
): number {
  return Math.max(0, floor - assignedCount);
}
