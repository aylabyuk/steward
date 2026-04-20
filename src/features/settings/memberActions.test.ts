import { describe, expect, it } from "vitest";
import type { WithId } from "@/hooks/_sub";
import type { Member } from "@/lib/types";
import {
  countActiveBishopric,
  LastBishopricError,
  setActive,
  updateCalling,
} from "./memberActions";

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

  it("allows demoting a bishopric when another active bishopric remains", async () => {
    const members = [
      member("a", { calling: "bishop", role: "bishopric" }),
      member("b", { calling: "first_counselor", role: "bishopric" }),
    ];
    // Will hit Firestore (we expect it to throw on the network attempt rather than the invariant).
    await expect(updateCalling("w1", members, "a", "ward_clerk")).rejects.not.toBeInstanceOf(
      LastBishopricError,
    );
  });
});
