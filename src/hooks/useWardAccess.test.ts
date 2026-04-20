import { describe, expect, it } from "vitest";
import { deriveAccess, type MemberAccess } from "./useWardAccess";

const mkMember = (wardId: string, uid = "u"): MemberAccess => ({
  wardId,
  uid,
  displayName: "Alice",
  email: "alice@example.com",
});

describe("deriveAccess", () => {
  it("returns `none` for an empty list", () => {
    expect(deriveAccess([])).toEqual({ kind: "none" });
  });

  it("returns `single` for one member", () => {
    const m = mkMember("ward-a");
    expect(deriveAccess([m])).toEqual({ kind: "single", member: m });
  });

  it("returns `multiple` for two or more members", () => {
    const ms = [mkMember("ward-a", "u1"), mkMember("ward-b", "u2")];
    expect(deriveAccess(ms)).toEqual({ kind: "multiple", members: ms });
  });
});
