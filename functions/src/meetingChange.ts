import type { WardSettingsDoc } from "./types.js";

export interface MeetingDocLite {
  meetingType?: string;
  status?: string;
  contentVersionHash?: string;
  cancellation?: { cancelled?: boolean; reason?: string };
}

export type MeetingChangeKind = "cancelled" | "uncancelled" | "updated";

const NO_MEETING_TYPES = new Set(["stake_conference", "general_conference"]);

/**
 * Classifies a meeting doc transition into the kind of notification (if any)
 * we should send. Returns null when the change is noise (only updatedAt
 * changed, doc just created with defaults, both states cancelled, etc.).
 */
export function classifyMeetingChange(
  before: MeetingDocLite | undefined,
  after: MeetingDocLite | undefined,
): MeetingChangeKind | null {
  // Doc deleted -> nothing to notify about.
  if (!after) return null;
  // Non-meeting Sundays never notify.
  if (after.meetingType && NO_MEETING_TYPES.has(after.meetingType)) return null;

  const wasCancelled = Boolean(before?.cancellation?.cancelled);
  const isCancelled = Boolean(after.cancellation?.cancelled);
  if (!wasCancelled && isCancelled) return "cancelled";
  if (wasCancelled && !isCancelled) return "uncancelled";
  if (isCancelled) return null; // remained cancelled
  // Skip the very first create (no real content yet).
  if (!before) return null;

  if (before.contentVersionHash !== after.contentVersionHash) return "updated";
  if (before.status !== after.status) return "updated";
  return null;
}

export function describeChange(kind: MeetingChangeKind, after: MeetingDocLite): string {
  switch (kind) {
    case "cancelled": {
      return after.cancellation?.reason
        ? `Meeting cancelled — ${after.cancellation.reason}`
        : "Meeting cancelled";
    }
    case "uncancelled": {
      return "Meeting reinstated";
    }
    case "updated": {
      return "Sacrament program updated";
    }
  }
}

export function timezoneFor(ward: { settings?: WardSettingsDoc } | undefined): string {
  return ward?.settings?.timezone ?? "UTC";
}
