import { describe, expect, it } from "vitest";
import type { AuthorMap, ChatMessage } from "./useConversation";
import { buildThreadItems } from "./threadItems";

function mk(sid: string, author: string, body: string, date: Date | null, index = 0): ChatMessage {
  return { sid, index, author, body, dateCreated: date, attributes: null };
}

const emptyAuthors: AuthorMap = new Map();

describe("buildThreadItems", () => {
  it("inserts a single day divider before the first message", () => {
    const d = new Date("2026-04-22T10:00:00");
    const items = buildThreadItems({
      messages: [mk("a", "uid:x", "hi", d, 0)],
      currentIdentity: null,
      authors: emptyAuthors,
      now: d,
    });
    expect(items.map((i) => i.kind)).toEqual(["day", "group"]);
    expect(items[0]).toMatchObject({ kind: "day", label: "Today" });
  });

  it("groups consecutive same-author messages and splits on author change", () => {
    const d = new Date("2026-04-22T10:00:00");
    const items = buildThreadItems({
      messages: [
        mk("a", "uid:x", "1", d, 0),
        mk("b", "uid:x", "2", d, 1),
        mk("c", "uid:y", "3", d, 2),
      ],
      currentIdentity: null,
      authors: emptyAuthors,
      now: d,
    });
    const groups = items.filter((i) => i.kind === "group");
    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({ kind: "group" });
    if (groups[0]?.kind === "group") expect(groups[0].group.messages).toHaveLength(2);
  });

  it("labels yesterday and earlier days correctly", () => {
    const now = new Date("2026-04-22T10:00:00");
    const yesterday = new Date("2026-04-21T10:00:00");
    const longAgo = new Date("2026-01-05T10:00:00");
    const items = buildThreadItems({
      messages: [mk("a", "u", "y", yesterday, 0), mk("b", "u", "old", longAgo, 1)],
      currentIdentity: null,
      authors: emptyAuthors,
      now,
    });
    const days = items.filter((i) => i.kind === "day");
    expect(days).toHaveLength(2);
    expect(days[0]).toMatchObject({ label: "Yesterday" });
    expect(days[1]?.kind === "day" && days[1].label).toMatch(/Jan/);
  });

  it("inserts an unread divider before the first incoming message at or after firstUnreadIndex", () => {
    const d = new Date("2026-04-22T10:00:00");
    const items = buildThreadItems({
      messages: [
        mk("a", "uid:me", "sent", d, 0),
        mk("b", "uid:other", "reply1", d, 1),
        mk("c", "uid:other", "reply2", d, 2),
      ],
      currentIdentity: "uid:me",
      authors: emptyAuthors,
      firstUnreadIndex: 1,
      now: d,
    });
    const kinds = items.map((i) => i.kind);
    expect(kinds).toContain("unread");
    const unreadIdx = kinds.indexOf("unread");
    expect(items[unreadIdx - 1]?.kind).toBe("group");
    expect(items[unreadIdx + 1]?.kind).toBe("group");
  });

  it("does not insert an unread divider for messages I sent", () => {
    const d = new Date("2026-04-22T10:00:00");
    const items = buildThreadItems({
      messages: [mk("a", "uid:me", "sent", d, 5)],
      currentIdentity: "uid:me",
      authors: emptyAuthors,
      firstUnreadIndex: 5,
      now: d,
    });
    expect(items.map((i) => i.kind)).not.toContain("unread");
  });
});
