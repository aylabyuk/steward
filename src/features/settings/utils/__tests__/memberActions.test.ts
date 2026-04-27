import { describe, expect, it } from "vitest";
import type { WithId } from "@/hooks/_sub";
import type { Member } from "@/lib/types";
import {
  countActiveBishopric,
  LastBishopricError,
  setActive,
  updateCalling,
  wouldRemoveLastBishopric,
} from "../memberActions";

function member(id: string, overrides: Partial<Member>): WithId<Member> {
  return {
    id,
    data: {
      email: `${id}@x.com`,
      displayName: id,
      calling: "ward_clerk",
      role: "clerk",
      active: true,
      ccOnEmails: true,
      fcmTokens: [],
      ...overrides,
    },
  };
}

describe("countActiveBishopric", () => {
  it("counts only active bishopric members", () => {
    const members = [
      member("a", { calling: "bishop", role: "bishopric" }),
      member("b", { calling: "first_counselor", role: "bishopric", active: false }),
      member("c", { calling: "second_counselor", role: "bishopric" }),
      member("d", { calling: "ward_clerk", role: "clerk" }),
    ];
    expect(countActiveBishopric(members)).toBe(2);
  });
});

describe("last-bishopric invariant", () => {
  it("blocks deactivating the only active bishopric", async () => {
    const members = [
      member("a", { calling: "bishop", role: "bishopric" }),
      member("b", { calling: "ward_clerk", role: "clerk" }),
    ];
    await expect(setActive("w1", members, "a", false)).rejects.toBeInstanceOf(LastBishopricError);
  });

  it("blocks demoting the only active bishopric to a clerk calling", async () => {
    const members = [
      member("a", { calling: "bishop", role: "bishopric" }),
      member("b", { calling: "ward_clerk", role: "clerk" }),
    ];
    await expect(updateCalling("w1", members, "a", "ward_clerk")).rejects.toBeInstanceOf(
      LastBishopricError,
    );
  });

  it("allows demoting a bishopric when another active bishopric remains", () => {
    // Pure invariant check: when more than one active bishopric exists,
    // demoting one is fine. (We don't actually call updateCalling here --
    // that would attempt a Firestore write and hang in environments without
    // emulator/network access. The invariant is what we want to assert.)
    const members = [
      member("a", { calling: "bishop", role: "bishopric" }),
      member("b", { calling: "first_counselor", role: "bishopric" }),
    ];
    expect(wouldRemoveLastBishopric(members, "a", { active: true, role: "clerk" })).toBe(false);
  });

  it("flags the would-strip transition for the only active bishopric", () => {
    const members = [
      member("a", { calling: "bishop", role: "bishopric" }),
      member("b", { calling: "ward_clerk", role: "clerk" }),
    ];
    expect(wouldRemoveLastBishopric(members, "a", { active: false, role: "bishopric" })).toBe(true);
  });
});
