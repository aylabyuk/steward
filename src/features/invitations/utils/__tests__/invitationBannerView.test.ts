import { describe, expect, it } from "vitest";
import type { Speaker, SpeakerInvitation } from "@/lib/types";
import { deriveBannerView, formatLastSeen } from "../invitationBannerView";

function speakerWith(status: Speaker["status"]): Speaker {
  return { name: "Test", status, role: "Member" } as Speaker;
}

function invitationWith(
  overrides: Partial<SpeakerInvitation> & {
    responseAnswer?: "yes" | "no";
    acknowledgedAt?: unknown;
    expiresAt?: Date;
  } = {},
): SpeakerInvitation {
  const inv: Partial<SpeakerInvitation> & Record<string, unknown> = {
    speakerRef: { meetingDate: "2026-05-04", speakerId: "s1" },
    assignedDate: "Sunday, May 4, 2026",
    sentOn: "April 27, 2026",
    wardName: "Test Ward",
    speakerName: "Test Speaker",
    inviterName: "Test Bishop",
    bodyMarkdown: "",
    footerMarkdown: "",
    deliveryRecord: [],
    bishopricParticipants: [],
  };
  if (overrides.responseAnswer) {
    const ack = overrides.acknowledgedAt
      ? { toDate: () => overrides.acknowledgedAt as Date }
      : undefined;
    inv.response = {
      answer: overrides.responseAnswer,
      respondedAt: { toDate: () => new Date() },
      actorUid: "speaker-uid",
      ...(ack ? { acknowledgedAt: ack } : {}),
    };
  }
  if (overrides.expiresAt) {
    inv.expiresAt = { toDate: () => overrides.expiresAt as Date };
  }
  return inv as SpeakerInvitation;
}

describe("deriveBannerView", () => {
  it("status=confirmed wins over everything", () => {
    const view = deriveBannerView(
      speakerWith("confirmed"),
      invitationWith({ responseAnswer: "no" }),
    );
    expect(view.message).toMatch(/accepted the assignment/);
    expect(view.showApply).toBe(false);
  });

  it("status=declined wins over everything", () => {
    const view = deriveBannerView(
      speakerWith("declined"),
      invitationWith({ responseAnswer: "yes" }),
    );
    expect(view.message).toMatch(/declined the invitation/);
  });

  it("unacknowledged yes reply surfaces Apply button with Confirm label", () => {
    const view = deriveBannerView(
      speakerWith("invited"),
      invitationWith({ responseAnswer: "yes" }),
    );
    expect(view.message).toMatch(/accepted.*confirm first/);
    expect(view.showApply).toBe(true);
    expect(view.applyLabel).toBe("Confirm");
  });

  it("unacknowledged no reply surfaces Apply button with Acknowledge label", () => {
    const view = deriveBannerView(speakerWith("invited"), invitationWith({ responseAnswer: "no" }));
    expect(view.message).toMatch(/declined/);
    expect(view.applyLabel).toBe("Acknowledge");
  });

  it("invited + no response + expired → expired message", () => {
    const view = deriveBannerView(
      speakerWith("invited"),
      invitationWith({ expiresAt: new Date(Date.now() - 60_000) }),
    );
    expect(view.message).toMatch(/expired/);
    expect(view.showApply).toBe(false);
  });

  it("invited + no response + not expired → waiting", () => {
    const view = deriveBannerView(speakerWith("invited"), invitationWith());
    expect(view.message).toMatch(/Waiting for speaker/);
  });

  it("planned + no response → planned message", () => {
    const view = deriveBannerView(speakerWith("planned"), invitationWith());
    expect(view.message).toMatch(/Planned/);
  });
});

describe("formatLastSeen", () => {
  it("returns null when timestamp missing", () => {
    expect(formatLastSeen(undefined)).toBeNull();
    expect(formatLastSeen({})).toBeNull();
  });

  it("recent → online now", () => {
    expect(formatLastSeen({ toDate: () => new Date(Date.now() - 30_000) })).toMatch(/viewing/);
  });

  it("minutes-ago bucket", () => {
    expect(formatLastSeen({ toDate: () => new Date(Date.now() - 10 * 60_000) })).toMatch(
      /10 min ago/,
    );
  });

  it("prayer kind switches noun", () => {
    expect(formatLastSeen({ toDate: () => new Date(Date.now() - 10 * 60_000) }, "prayer")).toMatch(
      /Prayer giver last seen/,
    );
  });
});

describe("deriveBannerView — kind awareness", () => {
  it("prayer kind reads as Prayer giver", () => {
    const inv = invitationWith();
    (inv as { kind?: string }).kind = "prayer";
    const view = deriveBannerView(speakerWith("confirmed"), inv);
    expect(view.message).toMatch(/Prayer giver/);
  });

  it("prayer kind waiting copy", () => {
    const inv = invitationWith();
    (inv as { kind?: string }).kind = "prayer";
    const view = deriveBannerView(speakerWith("invited"), inv);
    expect(view.message).toMatch(/Waiting for prayer giver/);
  });
});
