import { describe, expect, it } from "vitest";
import type { WithId } from "@/hooks/_sub";
import type { Speaker, SpeakerStatus } from "@/lib/types";
import { pendingInviteLabel } from "../pendingInviteLabel";

function speaker(status: SpeakerStatus | undefined, id = "x"): WithId<Speaker> {
  return { id, data: { name: "Sample", ...(status ? { status } : {}) } as Speaker };
}

describe("pendingInviteLabel", () => {
  it("returns null when there are no speakers", () => {
    expect(pendingInviteLabel([])).toBeNull();
  });

  it("treats a missing status as planned (not invited yet)", () => {
    expect(pendingInviteLabel([speaker(undefined)])).toBe("1 speaker has not been invited yet");
  });

  it("singular planned-only", () => {
    expect(pendingInviteLabel([speaker("planned")])).toBe("1 speaker has not been invited yet");
  });

  it("plural planned-only", () => {
    expect(pendingInviteLabel([speaker("planned", "a"), speaker("planned", "b")])).toBe(
      "2 speakers have not been invited yet",
    );
  });

  it("uses singular agreement on '1 of N'", () => {
    expect(pendingInviteLabel([speaker("planned", "a"), speaker("invited", "b")])).toBe(
      "1 of 2 speakers has not been invited yet",
    );
  });

  it("uses plural agreement on '>1 of N'", () => {
    expect(
      pendingInviteLabel([
        speaker("planned", "a"),
        speaker("planned", "b"),
        speaker("invited", "c"),
      ]),
    ).toBe("2 of 3 speakers have not been invited yet");
  });

  it("all-invited (singular)", () => {
    expect(pendingInviteLabel([speaker("invited")])).toBe("Speaker invited");
  });

  it("all-actioned (mix of invited/confirmed/declined) is treated as fully invited", () => {
    expect(
      pendingInviteLabel([
        speaker("invited", "a"),
        speaker("confirmed", "b"),
        speaker("declined", "c"),
      ]),
    ).toBe("All 3 speakers invited");
  });
});
