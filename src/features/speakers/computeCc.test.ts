import { describe, expect, it } from "vitest";
import type { WithId } from "@/hooks/_sub";
import type { Member } from "@/lib/types";
import { computeCc } from "./computeCc";

function mk(
  id: string,
  data: Partial<Member> & Pick<Member, "role" | "calling" | "email">,
): WithId<Member> {
  return {
    id,
    data: {
      displayName: id,
      active: true,
      ccOnEmails: true,
      fcmTokens: [],
      ...data,
    } as Member,
  };
}

describe("computeCc", () => {
  it("includes every active member with ccOnEmails=true regardless of role", () => {
    const cc = computeCc([
      mk("bishop", { role: "bishopric", calling: "bishop", email: "b@x.com" }),
      mk("cl1", { role: "bishopric", calling: "first_counselor", email: "c1@x.com" }),
      mk("clerk", { role: "clerk", calling: "ward_clerk", email: "clerk@x.com" }),
    ]);
    expect(cc).toEqual(["b@x.com", "c1@x.com", "clerk@x.com"]);
  });

  it("drops any member — bishopric or clerk — when ccOnEmails is false", () => {
    const cc = computeCc([
      mk("b", {
        role: "bishopric",
        calling: "bishop",
        email: "b@x.com",
        ccOnEmails: false,
      }),
      mk("c1", {
        role: "clerk",
        calling: "ward_clerk",
        email: "c1@x.com",
        ccOnEmails: true,
      }),
      mk("c2", {
        role: "clerk",
        calling: "executive_secretary",
        email: "c2@x.com",
        ccOnEmails: false,
      }),
    ]);
    expect(cc).toEqual(["c1@x.com"]);
  });

  it("excludes inactive members regardless of role", () => {
    const cc = computeCc([
      mk("b", {
        role: "bishopric",
        calling: "bishop",
        email: "b@x.com",
        active: false,
      }),
      mk("c", { role: "clerk", calling: "ward_clerk", email: "c@x.com" }),
    ]);
    expect(cc).toEqual(["c@x.com"]);
  });
});
