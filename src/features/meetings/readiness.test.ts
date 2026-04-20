import { describe, expect, it } from "vitest";
import type { WithId } from "@/hooks/_sub";
import type { Assignment, SacramentMeeting, Speaker } from "@/lib/types";
import { checkMeetingReadiness } from "./readiness";

const person: Assignment = {
  person: { name: "Alice" },
  status: "not_assigned",
};

const complete: SacramentMeeting = {
  meetingType: "regular",
  status: "draft",
  approvals: [],
  wardBusiness: "",
  stakeBusiness: "",
  announcements: "",
  openingHymn: { number: 1, title: "a" },
  sacramentHymn: { number: 2, title: "b" },
  closingHymn: { number: 3, title: "c" },
  openingPrayer: person,
  benediction: person,
  pianist: person,
  chorister: person,
  sacramentBread: person,
  sacramentBlessers: [person, person],
};

const twoSpeakers: WithId<Speaker>[] = [
  { id: "s1", data: { name: "A", status: "confirmed", role: "Member" } },
  { id: "s2", data: { name: "B", status: "confirmed", role: "Member" } },
];

describe("checkMeetingReadiness", () => {
  it("returns empty for a fully-filled regular meeting", () => {
    expect(checkMeetingReadiness(complete, twoSpeakers, "regular")).toEqual([]);
  });

  it("flags a not-yet-created meeting", () => {
    expect(checkMeetingReadiness(null, [], "regular")).toEqual(["Meeting not created yet"]);
  });

  it("flags missing speakers for regular meetings", () => {
    const out = checkMeetingReadiness(complete, [twoSpeakers[0]!], "regular");
    expect(out).toContain("1 more speaker(s) needed");
  });

  it("does not require speakers for fast Sunday", () => {
    const out = checkMeetingReadiness(
      { ...complete, meetingType: "fast" },
      [],
      "fast",
    );
    expect(out).toEqual([]);
  });

  it("flags every missing hymn + assignment on an empty regular meeting", () => {
    const empty: SacramentMeeting = {
      meetingType: "regular",
      status: "draft",
      approvals: [],
      wardBusiness: "",
      stakeBusiness: "",
      announcements: "",
    };
    const out = checkMeetingReadiness(empty, [], "regular");
    expect(out).toContain("Opening hymn");
    expect(out).toContain("Sacrament hymn");
    expect(out).toContain("Closing hymn");
    expect(out).toContain("Opening prayer");
    expect(out).toContain("Benediction");
    expect(out).toContain("Pianist");
    expect(out).toContain("Chorister");
    expect(out).toContain("Sacrament bread");
  });

  it("returns empty for non-regular meeting types", () => {
    expect(checkMeetingReadiness(complete, [], "stake")).toEqual([]);
    expect(checkMeetingReadiness(complete, [], "general")).toEqual([]);
  });
});
