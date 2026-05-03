import { describe, expect, it } from "vitest";
import type { WithId } from "@/hooks/_sub";
import type { SacramentMeeting, Speaker } from "@/lib/types";
import { canonicalizeContent, computeContentHash } from "../contentHash";

const base: SacramentMeeting = {
  meetingType: "regular",
  wardBusiness: "",
  stakeBusiness: "",
  announcements: "",
  showAnnouncements: true,
  visitors: [],
};

const speaker = (id: string, name: string): WithId<Speaker> => ({
  id,
  data: { name, status: "planned", role: "Member" },
});

describe("canonicalizeContent", () => {
  it("returns the same string for equivalent meetings regardless of speaker order", () => {
    const a = canonicalizeContent(base, [speaker("s1", "Alice"), speaker("s2", "Bob")]);
    const b = canonicalizeContent(base, [speaker("s2", "Bob"), speaker("s1", "Alice")]);
    expect(a).toBe(b);
  });

  it("changes when meetingType changes", () => {
    const a = canonicalizeContent(base, []);
    const b = canonicalizeContent({ ...base, meetingType: "fast" }, []);
    expect(a).not.toBe(b);
  });

  it("changes when a hymn changes", () => {
    const a = canonicalizeContent(
      { ...base, openingHymn: { number: 30, title: "Come, Come, Ye Saints" } },
      [],
    );
    const b = canonicalizeContent({ ...base, openingHymn: { number: 92, title: "..." } }, []);
    expect(a).not.toBe(b);
  });

  it("ignores cancellation (cancellation toggle shouldn't fan out as a content edit)", () => {
    const a = canonicalizeContent(base, []);
    const b = canonicalizeContent(
      {
        ...base,
        cancellation: {
          cancelled: true,
          reason: "weather",
          cancelledAt: null,
          cancelledBy: "u1",
        },
      },
      [],
    );
    expect(a).toBe(b);
  });

  it("changes when a speaker is added", () => {
    const a = canonicalizeContent(base, [speaker("s1", "Alice")]);
    const b = canonicalizeContent(base, [speaker("s1", "Alice"), speaker("s2", "Bob")]);
    expect(a).not.toBe(b);
  });

  it("changes when a speaker's topic is edited", () => {
    const s1: WithId<Speaker> = {
      id: "s1",
      data: { name: "Alice", status: "planned", role: "Member" },
    };
    const s1Edited: WithId<Speaker> = {
      id: "s1",
      data: { name: "Alice", topic: "Faith", status: "planned", role: "Member" },
    };
    expect(canonicalizeContent(base, [s1])).not.toBe(canonicalizeContent(base, [s1Edited]));
  });
});

describe("computeContentHash", () => {
  it("produces a 16-char hex string", async () => {
    const h = await computeContentHash(base, []);
    expect(h).toMatch(/^[0-9a-f]{16}$/);
  });

  it("produces the same hash for equivalent content", async () => {
    const a = await computeContentHash(base, [speaker("s1", "Alice")]);
    const b = await computeContentHash(base, [speaker("s1", "Alice")]);
    expect(a).toBe(b);
  });

  it("produces different hashes for different content", async () => {
    const a = await computeContentHash(base, []);
    const b = await computeContentHash({ ...base, meetingType: "fast" }, []);
    expect(a).not.toBe(b);
  });
});
