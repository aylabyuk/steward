import { describe, expect, it } from "vitest";
import type { WithId } from "@/hooks/_sub";
import type { Assignment, SacramentMeeting, Speaker } from "@/lib/types";
import { checkMeetingReadiness } from "../readiness";

const confirmed: Assignment = { person: { name: "Alice" }, confirmed: true };

const complete: SacramentMeeting = {
  meetingType: "regular",
  status: "draft",
  approvals: [],
  wardBusiness: "",
  stakeBusiness: "",
  announcements: "",
  showAnnouncements: true,
  openingHymn: { number: 1, title: "a" },
  sacramentHymn: { number: 2, title: "b" },
  closingHymn: { number: 3, title: "c" },
  openingPrayer: confirmed,
  benediction: confirmed,
  pianist: confirmed,
  chorister: confirmed,
  sacramentBread: confirmed,
  sacramentBlessers: [confirmed, confirmed],
  presiding: confirmed,
  conducting: confirmed,
};

const twoSpeakers: WithId<Speaker>[] = [
  { id: "s1", data: { name: "A", status: "confirmed", role: "Member" } },
  { id: "s2", data: { name: "B", status: "confirmed", role: "Member" } },
];

describe("checkMeetingReadiness", () => {
  it("marks a fully-filled regular meeting ready", () => {
    const r = checkMeetingReadiness(complete, twoSpeakers, "regular");
    expect(r.ready).toBe(true);
    expect(r.missing).toEqual([]);
    expect(r.unconfirmed).toEqual([]);
  });

  it("flags a not-yet-created meeting", () => {
    const r = checkMeetingReadiness(null, [], "regular");
    expect(r.ready).toBe(false);
    expect(r.missing).toEqual(["Meeting not created yet"]);
  });

  it("flags missing speakers for regular meetings", () => {
    const r = checkMeetingReadiness(complete, [twoSpeakers[0]!], "regular");
    expect(r.missing).toContain("1 more speaker(s) needed");
    expect(r.ready).toBe(false);
  });

  it("does not require speakers for fast Sunday", () => {
    const r = checkMeetingReadiness({ ...complete, meetingType: "fast" }, [], "fast");
    expect(r.ready).toBe(true);
  });

  it("separates 'missing' (no assignment) from 'unconfirmed' (assigned but not confirmed)", () => {
    const draft: Assignment = { person: { name: "Bob" }, confirmed: false };
    const r = checkMeetingReadiness({ ...complete, openingPrayer: draft }, twoSpeakers, "regular");
    expect(r.missing).not.toContain("Opening prayer — not assigned");
    expect(r.unconfirmed).toContain("Opening prayer — not confirmed");
    expect(r.ready).toBe(false);
  });

  it("blocks approval when any speaker is not confirmed", () => {
    const [a, b] = twoSpeakers;
    const r = checkMeetingReadiness(
      complete,
      [a!, { ...b!, data: { ...b!.data, status: "invited" } }],
      "regular",
    );
    expect(r.unconfirmed).toContain("B — not confirmed");
    expect(r.ready).toBe(false);
  });

  it("flags every missing hymn + assignment on an empty regular meeting", () => {
    const empty: SacramentMeeting = {
      meetingType: "regular",
      status: "draft",
      approvals: [],
      wardBusiness: "",
      stakeBusiness: "",
      announcements: "",
      showAnnouncements: true,
    };
    const r = checkMeetingReadiness(empty, [], "regular");
    expect(r.missing).toContain("Opening hymn");
    expect(r.missing).toContain("Sacrament hymn");
    expect(r.missing).toContain("Closing hymn");
    expect(r.missing).toContain("Presiding — not assigned");
    expect(r.missing).toContain("Conducting — not assigned");
    expect(r.missing).toContain("Opening prayer — not assigned");
    expect(r.missing).toContain("Benediction — not assigned");
    expect(r.missing).toContain("Pianist — not assigned");
    expect(r.missing).toContain("Chorister — not assigned");
    expect(r.missing).toContain("Sacrament bread — not assigned");
  });

  it("is ready for non-regular meeting types without extra checks", () => {
    expect(checkMeetingReadiness(complete, [], "stake").ready).toBe(true);
    expect(checkMeetingReadiness(complete, [], "general").ready).toBe(true);
  });
});
