/** Two-letter initials from a display name. "Firstname Lastname"
 *  → "FL"; a single-word name falls back to the first two characters
 *  of that word. Empty or falsy input returns "?". */
export function initialsOf(displayName: string | null | undefined): string {
  if (!displayName) return "?";
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]!.slice(0, 2) || "?").toUpperCase();
  return `${parts[0]!.charAt(0)}${parts.at(-1)!.charAt(0)}`.toUpperCase();
}

/** Palette of background + text pairs used for the initials-fallback
 *  avatar. Colors come from the app's parchment/bordeaux palette so
 *  they sit naturally next to other UI; we only need *enough* colors
 *  that members of the same ward don't routinely collide. */
const AVATAR_PALETTE: readonly { bg: string; fg: string; border: string }[] = [
  { bg: "bg-bordeaux", fg: "text-parchment", border: "border-bordeaux-deep" },
  { bg: "bg-brass-soft", fg: "text-brass-deep", border: "border-brass-soft" },
  { bg: "bg-walnut", fg: "text-parchment", border: "border-walnut-2" },
  { bg: "bg-success-soft", fg: "text-success", border: "border-success-soft" },
  { bg: "bg-parchment-2", fg: "text-walnut-2", border: "border-border-strong" },
  { bg: "bg-danger-soft", fg: "text-bordeaux", border: "border-danger-soft" },
];

/** Deterministic palette pick for a given seed (typically a uid).
 *  Same seed → same slot on every render, every device, every
 *  session. Uses a tiny FNV-1a variant — good enough for bucketing
 *  a few dozen uids across six slots. Empty seeds land on slot 0
 *  rather than throwing. */
export function avatarPaletteFor(seed: string | null | undefined): {
  bg: string;
  fg: string;
  border: string;
} {
  if (!seed) return AVATAR_PALETTE[0]!;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const idx = Math.abs(h) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx]!;
}
