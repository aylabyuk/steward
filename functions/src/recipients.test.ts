import { describe, expect, it } from "vitest";
import { filterRecipients, type RecipientCandidate } from "./recipients.js";
import type { MemberDoc } from "./types.js";

function member(overrides: Partial<MemberDoc> = {}): MemberDoc {
  return {
    email: "x@x.com",
    displayName: "X",
    role: "clerk",
    active: true,
    fcmTokens: [{ token: "t1" }],
    ...overrides,
  };
}

const ctx = { now: new Date("2026-04-20T15:00:00Z"), timezone: "UTC" };

describe("filterRecipients", () => {
  it("excludes the originating author", () => {
    const candidates: RecipientCandidate[] = [
      { uid: "alice", member: member() },
      { uid: "bob", member: member() },
    ];
    const out = filterRecipients(candidates, { ...ctx, excludeUid: "alice" });
    expect(out.map((r) => r.uid)).toEqual(["bob"]);
  });

  it("drops inactive members", () => {
    const out = filterRecipients(
      [{ uid: "alice", member: member({ active: false }) }],
      ctx,
    );
    expect(out).toEqual([]);
  });

  it("drops members who disabled notifications", () => {
    const out = filterRecipients(
      [{ uid: "alice", member: member({ notificationPrefs: { enabled: false } }) }],
      ctx,
    );
    expect(out).toEqual([]);
  });

  it("drops members in their quiet hours", () => {
    const out = filterRecipients(
      [
        {
          uid: "alice",
          member: member({
            notificationPrefs: { enabled: true, quietHours: { startHour: 14, endHour: 18 } },
          }),
        },
      ],
      ctx,
    );
    expect(out).toEqual([]);
  });

  it("drops members without any FCM tokens", () => {
    const out = filterRecipients(
      [{ uid: "alice", member: member({ fcmTokens: [] }) }],
      ctx,
    );
    expect(out).toEqual([]);
  });

  it("keeps healthy candidates", () => {
    const out = filterRecipients([{ uid: "alice", member: member() }], ctx);
    expect(out.map((r) => r.uid)).toEqual(["alice"]);
  });
});
