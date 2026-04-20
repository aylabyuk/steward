import type { NudgeDay } from "./nudgeSlot.js";
import type { MeetingDocLite } from "./meetingChange.js";

const NO_MEETING_TYPES = new Set(["stake", "general"]);

export interface NudgeMember {
  uid: string;
  role: "bishopric" | "clerk";
  active: boolean;
}

export interface NudgeTarget {
  uids: string[];
  title: string;
  body: string;
  severity: "soft" | "urgent" | "critical";
}

const SEVERITY_BY_DAY: Record<NudgeDay, NudgeTarget["severity"]> = {
  wednesday: "soft",
  friday: "urgent",
  saturday: "critical",
};

/**
 * Decides who (if anyone) should be nudged for a given upcoming Sunday on a
 * given slot. Returns null when no nudge applies.
 *
 * Inputs are intentionally narrow so the logic is easy to test:
 *   - meeting:        Firestore-shaped meeting doc, or null if it doesn't exist
 *   - approvedUids:   set of uids that have already approved (i.e. live, non-invalidated)
 *   - members:        active roster summary
 */
export function computeNudgeTarget(args: {
  day: NudgeDay;
  date: string;
  meeting: MeetingDocLite | null;
  approvedUids: ReadonlySet<string>;
  members: readonly NudgeMember[];
}): NudgeTarget | null {
  const { meeting, members, approvedUids } = args;
  const severity = SEVERITY_BY_DAY[args.day];
  const activeUids = members.filter((m) => m.active).map((m) => m.uid);
  const bishopUids = members.filter((m) => m.active && m.role === "bishopric").map((m) => m.uid);

  if (!meeting) {
    if (activeUids.length === 0) return null;
    return {
      uids: activeUids,
      title: `No program yet for Sunday ${args.date}`,
      body: "Please create a program for the upcoming sacrament meeting.",
      severity,
    };
  }
  if (meeting.cancellation?.cancelled) return null;
  if (meeting.meetingType && NO_MEETING_TYPES.has(meeting.meetingType)) return null;
  if (meeting.status === "approved") return null;

  if (meeting.status === "pending_approval") {
    const pending = bishopUids.filter((uid) => !approvedUids.has(uid));
    if (pending.length === 0) return null;
    return {
      uids: pending,
      title: `Approval needed — Sunday ${args.date}`,
      body: "A bishopric approval is still required before printing.",
      severity,
    };
  }

  // status === 'draft' or anything else editable
  if (activeUids.length === 0) return null;
  return {
    uids: activeUids,
    title: `Program needs review — Sunday ${args.date}`,
    body: "Help finalize the upcoming sacrament program.",
    severity,
  };
}
