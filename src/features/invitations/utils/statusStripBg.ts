import type { SpeakerStatus } from "@/lib/types";

/** Tailwind gradient classes for the status-switcher strip background.
 *  Used by both InvitationStatusBanner (when a chat invitation exists)
 *  and NoInvitationPlaceholder (when one doesn't), so the top of the
 *  chat dialog carries the same tinted shell regardless of which
 *  surface renders. Keeps colour shifts consistent as a speaker moves
 *  through the status lifecycle. */
export function statusStripBg(status: SpeakerStatus): string {
  switch (status) {
    case "confirmed":
      return "bg-gradient-to-br from-success-soft to-success-soft/55";
    case "declined":
      return "bg-gradient-to-br from-danger-soft to-danger-soft/55";
    case "invited":
      return "bg-gradient-to-br from-brass-soft/70 to-brass-soft/30";
    case "planned":
      return "bg-gradient-to-br from-parchment-2 to-parchment";
  }
}
