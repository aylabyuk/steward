import { describe, expect, it } from "vitest";
import { buildBishopricReceipt, buildSpeakerReceipt } from "./invitationReceiptContent.js";
import type { SpeakerInvitationShape } from "./invitationTypes.js";

function mk(overrides: Partial<SpeakerInvitationShape> = {}): SpeakerInvitationShape {
  return {
    speakerRef: { meetingDate: "2026-05-03", speakerId: "sp1" },
    assignedDate: "Sunday, May 3, 2026",
    sentOn: "April 22, 2026",
    wardName: "Test Ward",
    speakerName: "Sister Jones",
    inviterName: "Bishop Smith",
    bodyMarkdown: "We invite you to speak.\n\nTopic: faith.",
    footerMarkdown: '"Let thy speech be alway with grace..."',
    ...overrides,
  };
}

describe("buildSpeakerReceipt", () => {
  it("throws when the invitation has no recorded response", () => {
    expect(() => buildSpeakerReceipt({ invitation: mk() })).toThrow();
  });

  it("phrases the Yes case as 'accepted' and includes the letter inline", () => {
    const content = buildSpeakerReceipt({
      invitation: mk({ response: { answer: "yes" } }),
    });
    expect(content.subject).toMatch(/accepted/);
    expect(content.subject).toMatch(/Sunday, May 3, 2026/);
    expect(content.text).toMatch(/You accepted the invitation/);
    expect(content.text).toMatch(/We invite you to speak\./);
    expect(content.html).toMatch(/You accepted the invitation/);
  });

  it("phrases the No case as 'declined'", () => {
    const content = buildSpeakerReceipt({
      invitation: mk({ response: { answer: "no" } }),
    });
    expect(content.subject).toMatch(/declined/);
    expect(content.text).toMatch(/You declined the invitation/);
  });

  it("surfaces the speaker's reason when provided", () => {
    const content = buildSpeakerReceipt({
      invitation: mk({ response: { answer: "no", reason: "I'm out of town." } }),
    });
    expect(content.text).toMatch(/Your note: I'm out of town/);
    expect(content.html).toMatch(/I&#39;m out of town/);
  });
});

describe("buildBishopricReceipt", () => {
  it("throws when the invitation has no recorded response", () => {
    expect(() => buildBishopricReceipt({ invitation: mk() })).toThrow();
  });

  it("names the speaker in the subject and includes a view URL when provided", () => {
    const content = buildBishopricReceipt({
      invitation: mk({ response: { answer: "yes" } }),
      bishopricViewUrl: "https://steward-app.ca/ward/w1/invitations/i1/view",
      acknowledgedByName: "Bishop Smith",
    });
    expect(content.subject).toMatch(/Sister Jones accepted/);
    expect(content.text).toMatch(/Applied by: Bishop Smith/);
    expect(content.text).toMatch(/View this invitation in Steward: https:\/\/steward-app\.ca/);
    expect(content.html).toMatch(/href="https:\/\/steward-app\.ca/);
  });

  it("declined variant lands under 'declined' phrasing", () => {
    const content = buildBishopricReceipt({
      invitation: mk({ response: { answer: "no" } }),
    });
    expect(content.subject).toMatch(/Sister Jones declined/);
  });

  it("omits the view-URL block when not provided", () => {
    const content = buildBishopricReceipt({
      invitation: mk({ response: { answer: "yes" } }),
    });
    expect(content.text).not.toMatch(/View this invitation in Steward/);
    expect(content.html).not.toMatch(/href="/);
  });
});
