import { describe, expect, it } from "vitest";
import type { WithId } from "@/hooks/_sub";
import type { Assignment, SacramentMeeting, Speaker } from "@/lib/types";
import type { ReadinessReport } from "../readiness";
import { buildRailSections } from "./railSections";

const emptyReport: ReadinessReport = {
  missing: [],
  unconfirmed: [],
  totalItems: 0,
  doneCount: 0,
  ready: true,
};

function assigned(name: string, confirmed: boolean): Assignment {
  return { person: { name }, confirmed };
}

function speaker(id: string, status: Speaker["status"], name = id): WithId<Speaker> {
  return { id, data: { name, status, role: "Member" } };
}

function meeting(overrides: Partial<SacramentMeeting> = {}): SacramentMeeting {
  return {
    meetingType: "regular",
    status: "draft",
    approvals: [],
    wardBusiness: "",
    stakeBusiness: "",
    announcements: "",
    showAnnouncements: true,
    visitors: [],
    requiredApprovals: 2,
    ...overrides,
  };
}

function pickState(sections: ReturnType<typeof buildRailSections>, id: string): string {
  const s = sections.find((x) => x.id === id);
  if (!s) throw new Error(`no section ${id}`);
  return s.state;
}

describe("buildRailSections — approval overview", () => {
  it("is done when the readiness report is ready", () => {
    const sections = buildRailSections(meeting(), [], "regular", { ...emptyReport, ready: true });
    expect(pickState(sections, "sec-overview")).toBe("done");
  });

  it("is missing when the readiness report is not ready", () => {
    const sections = buildRailSections(meeting(), [], "regular", { ...emptyReport, ready: false });
    expect(pickState(sections, "sec-overview")).toBe("missing");
  });
});

describe("buildRailSections — leaders/prayers/sacrament", () => {
  it("marks leaders missing when any slot lacks a person", () => {
    const sections = buildRailSections(
      meeting({ presiding: assigned("A", true) }),
      [],
      "regular",
      emptyReport,
    );
    expect(pickState(sections, "sec-leaders")).toBe("missing");
  });

  it("marks leaders unconfirmed when assigned but not confirmed", () => {
    const sections = buildRailSections(
      meeting({
        presiding: assigned("A", false),
        conducting: assigned("B", false),
      }),
      [],
      "regular",
      emptyReport,
    );
    expect(pickState(sections, "sec-leaders")).toBe("unconfirmed");
  });

  it("marks leaders done when all assigned and confirmed", () => {
    const sections = buildRailSections(
      meeting({
        presiding: assigned("A", true),
        conducting: assigned("B", true),
      }),
      [],
      "regular",
      emptyReport,
    );
    expect(pickState(sections, "sec-leaders")).toBe("done");
  });

  it("marks sacrament missing if any blesser slot is empty", () => {
    const sections = buildRailSections(
      meeting({
        sacramentBread: assigned("A", true),
        sacramentBlessers: [assigned("B", true)],
      }),
      [],
      "regular",
      emptyReport,
    );
    expect(pickState(sections, "sec-sacrament")).toBe("missing");
  });

  it("marks sacrament done when all three roles are confirmed", () => {
    const sections = buildRailSections(
      meeting({
        sacramentBread: assigned("A", true),
        sacramentBlessers: [assigned("B", true), assigned("C", true)],
      }),
      [],
      "regular",
      emptyReport,
    );
    expect(pickState(sections, "sec-sacrament")).toBe("done");
  });
});

describe("buildRailSections — speakers (regular meeting only)", () => {
  it("is missing when fewer than 2 speakers", () => {
    const sections = buildRailSections(
      meeting(),
      [speaker("1", "confirmed")],
      "regular",
      emptyReport,
    );
    expect(pickState(sections, "sec-speakers")).toBe("missing");
  });

  it("is unconfirmed when >=2 speakers but any is not confirmed", () => {
    const sections = buildRailSections(
      meeting(),
      [speaker("1", "confirmed"), speaker("2", "invited")],
      "regular",
      emptyReport,
    );
    expect(pickState(sections, "sec-speakers")).toBe("unconfirmed");
  });

  it("is done when all speakers are confirmed", () => {
    const sections = buildRailSections(
      meeting(),
      [speaker("1", "confirmed"), speaker("2", "confirmed")],
      "regular",
      emptyReport,
    );
    expect(pickState(sections, "sec-speakers")).toBe("done");
  });

  it("omits the speakers section for non-regular meeting types", () => {
    const sections = buildRailSections(meeting({ meetingType: "stake" }), [], "stake", emptyReport);
    expect(sections.find((s) => s.id === "sec-speakers")).toBeUndefined();
  });
});

describe("buildRailSections — music & hymns", () => {
  const withAllHymns = {
    openingHymn: { number: 1, title: "A" },
    sacramentHymn: { number: 2, title: "B" },
    closingHymn: { number: 3, title: "C" },
  };

  it("is missing when any hymn is not picked", () => {
    const sections = buildRailSections(
      meeting({ chorister: assigned("A", true), pianist: assigned("B", true) }),
      [],
      "regular",
      emptyReport,
    );
    expect(pickState(sections, "sec-music")).toBe("missing");
  });

  it("is missing when all hymns are set but chorister is missing", () => {
    const sections = buildRailSections(meeting({ ...withAllHymns }), [], "regular", emptyReport);
    expect(pickState(sections, "sec-music")).toBe("missing");
  });

  it("is unconfirmed when everything is in place but chorister/pianist unconfirmed", () => {
    const sections = buildRailSections(
      meeting({
        ...withAllHymns,
        chorister: assigned("A", false),
        pianist: assigned("B", true),
      }),
      [],
      "regular",
      emptyReport,
    );
    expect(pickState(sections, "sec-music")).toBe("unconfirmed");
  });

  it("is done when hymns are set and chorister/pianist are confirmed", () => {
    const sections = buildRailSections(
      meeting({
        ...withAllHymns,
        chorister: assigned("A", true),
        pianist: assigned("B", true),
      }),
      [],
      "regular",
      emptyReport,
    );
    expect(pickState(sections, "sec-music")).toBe("done");
  });
});
