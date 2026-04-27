import { describe, expect, it } from "vitest";
import type { WithId } from "@/hooks/_sub";
import type { Member } from "@/lib/types";
import { extractMentions } from "../extractMentions";

function mk(id: string, displayName: string, active = true): WithId<Member> {
  return {
    id,
    data: {
      email: `${id}@x.com`,
      displayName,
      calling: "bishop",
      role: "bishopric",
      active,
      ccOnEmails: true,
      fcmTokens: [],
    },
  };
}

describe("extractMentions", () => {
  it("returns an empty list when there are no @mentions", () => {
    const members = [mk("u1", "Alice")];
    expect(extractMentions("Just regular text.", members)).toEqual([]);
  });

  it("matches a simple @Name", () => {
    const members = [mk("u1", "Alice"), mk("u2", "Bob")];
    expect(extractMentions("@Alice can you cover that week?", members)).toEqual(["u1"]);
  });

  it("matches @Full Name with spaces", () => {
    const members = [mk("u1", "Alice Smith"), mk("u2", "Bob")];
    expect(extractMentions("ping @Alice Smith please", members)).toEqual(["u1"]);
  });

  it("matches multiple mentions in the same body", () => {
    const members = [mk("u1", "Alice"), mk("u2", "Bob")];
    expect(new Set(extractMentions("@Alice and @Bob, FYI.", members))).toEqual(
      new Set(["u1", "u2"]),
    );
  });

  it("is case-insensitive", () => {
    const members = [mk("u1", "Alice")];
    expect(extractMentions("@alice please reply", members)).toEqual(["u1"]);
  });

  it("ignores @name strings that don't match any member", () => {
    const members = [mk("u1", "Alice")];
    expect(extractMentions("@Unknown and @Alice", members)).toEqual(["u1"]);
  });

  it("excludes inactive members", () => {
    const members = [mk("u1", "Alice", false), mk("u2", "Bob")];
    expect(extractMentions("@Alice @Bob", members)).toEqual(["u2"]);
  });

  it("dedupes when the same name appears more than once", () => {
    const members = [mk("u1", "Alice")];
    expect(extractMentions("@Alice @Alice @Alice", members)).toEqual(["u1"]);
  });

  it("resolves ambiguous names to all matching uids", () => {
    const members = [mk("u1", "John"), mk("u2", "John")];
    expect(new Set(extractMentions("hey @John", members))).toEqual(new Set(["u1", "u2"]));
  });

  it("respects word boundaries -- @Ali does not match Alice", () => {
    const members = [mk("u1", "Alice")];
    expect(extractMentions("@Ali here", members)).toEqual([]);
  });
});
