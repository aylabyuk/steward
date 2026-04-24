import { describe, expect, it } from "vitest";
import { buildMessagePermissions, findLastMineIndex } from "./messageActions";
import type { ChatMessage } from "./useConversation";

function msg(overrides: Partial<ChatMessage> & Pick<ChatMessage, "sid" | "author">): ChatMessage {
  return {
    index: 0,
    body: "",
    dateCreated: null,
    dateUpdated: null,
    attributes: null,
    ...overrides,
  };
}

const BISHOP_A = "uid:bishop-a";
const BISHOP_B = "uid:bishop-b";
const SPEAKER = "speaker:abc123";

describe("buildMessagePermissions", () => {
  it("returns a no-op when currentIdentity is null", () => {
    const { canDelete, canEdit } = buildMessagePermissions(null, [
      msg({ sid: "1", author: BISHOP_A }),
    ]);
    expect(canDelete(msg({ sid: "1", author: BISHOP_A }))).toBe(false);
    expect(canEdit(msg({ sid: "1", author: BISHOP_A }))).toBe(false);
  });

  it("bishop can delete another bishop's message within the last 5 thread messages", () => {
    const messages = [
      msg({ sid: "1", author: SPEAKER }),
      msg({ sid: "2", author: BISHOP_B }),
      msg({ sid: "3", author: SPEAKER }),
      msg({ sid: "4", author: BISHOP_B }),
      msg({ sid: "5", author: BISHOP_A }),
    ];
    const { canDelete } = buildMessagePermissions(BISHOP_A, messages);
    expect(canDelete(messages[3]!)).toBe(true); // bishop_b within window
    expect(canDelete(messages[4]!)).toBe(true); // bishop_a's own
  });

  it("bishop cannot delete a speaker's message (cross-side)", () => {
    const messages = [
      msg({ sid: "1", author: SPEAKER }),
      msg({ sid: "2", author: BISHOP_A }),
    ];
    const { canDelete } = buildMessagePermissions(BISHOP_A, messages);
    expect(canDelete(messages[0]!)).toBe(false);
  });

  it("speaker can only delete their own messages", () => {
    const messages = [
      msg({ sid: "1", author: BISHOP_A }),
      msg({ sid: "2", author: SPEAKER }),
    ];
    const { canDelete } = buildMessagePermissions(SPEAKER, messages);
    expect(canDelete(messages[0]!)).toBe(false);
    expect(canDelete(messages[1]!)).toBe(true);
  });

  it("structural messages (status-change, invitation, quick-action) are never deletable", () => {
    const messages = [
      msg({
        sid: "1",
        author: BISHOP_A,
        attributes: { kind: "status-change", status: "confirmed" },
      }),
      msg({ sid: "2", author: BISHOP_A, attributes: { kind: "invitation" } }),
      msg({ sid: "3", author: SPEAKER, attributes: { responseType: "yes" } }),
      msg({ sid: "4", author: BISHOP_A }),
    ];
    const { canDelete } = buildMessagePermissions(BISHOP_A, messages);
    expect(canDelete(messages[0]!)).toBe(false);
    expect(canDelete(messages[1]!)).toBe(false);
    expect(canDelete(messages[2]!)).toBe(false);
    expect(canDelete(messages[3]!)).toBe(true);
  });

  it("delete window is the last 5 messages of the thread", () => {
    const messages = Array.from({ length: 10 }, (_, i) =>
      msg({ sid: `${i + 1}`, author: BISHOP_A }),
    );
    const { canDelete } = buildMessagePermissions(BISHOP_A, messages);
    expect(canDelete(messages[4]!)).toBe(false); // index 4 = 5th from end of 10 → out
    expect(canDelete(messages[5]!)).toBe(true); // index 5 = within last 5
    expect(canDelete(messages[9]!)).toBe(true);
  });

  it("edit is restricted to the author's own last 5 (not the thread's last 5)", () => {
    // Viewer has sent 7 messages interleaved with 8 from others; only
    // the viewer's trailing 5 should be editable, even though the
    // author's earliest two are still within the thread's last 12.
    const messages: ChatMessage[] = [];
    for (let i = 0; i < 7; i++) {
      messages.push(msg({ sid: `mine-${i}`, author: BISHOP_A, index: i * 2 }));
      messages.push(msg({ sid: `theirs-${i}`, author: BISHOP_B, index: i * 2 + 1 }));
    }
    const { canEdit } = buildMessagePermissions(BISHOP_A, messages);
    // mine-0 and mine-1 are outside the author's last-5 window
    expect(canEdit(messages[0]!)).toBe(false);
    expect(canEdit(messages[2]!)).toBe(false);
    // mine-2..mine-6 are the author's last 5
    expect(canEdit(messages[4]!)).toBe(true);
    expect(canEdit(messages[12]!)).toBe(true);
    // Another bishop's messages are never editable by BISHOP_A
    expect(canEdit(messages[1]!)).toBe(false);
  });

  it("structural mine-messages do not consume an edit slot and are not editable", () => {
    const messages = [
      msg({
        sid: "1",
        author: BISHOP_A,
        attributes: { kind: "status-change", status: "confirmed" },
      }),
      msg({ sid: "2", author: BISHOP_A }),
    ];
    const { canEdit } = buildMessagePermissions(BISHOP_A, messages);
    expect(canEdit(messages[0]!)).toBe(false);
    expect(canEdit(messages[1]!)).toBe(true);
  });
});

describe("findLastMineIndex", () => {
  it("returns null when currentIdentity is null", () => {
    expect(findLastMineIndex([msg({ sid: "1", author: BISHOP_A, index: 3 })], null)).toBeNull();
  });

  it("returns the Twilio index of the latest matching message", () => {
    const messages = [
      msg({ sid: "1", author: SPEAKER, index: 0 }),
      msg({ sid: "2", author: BISHOP_A, index: 1 }),
      msg({ sid: "3", author: SPEAKER, index: 2 }),
      msg({ sid: "4", author: BISHOP_A, index: 3 }),
    ];
    expect(findLastMineIndex(messages, BISHOP_A)).toBe(3);
  });

  it("returns null when no messages match", () => {
    expect(findLastMineIndex([msg({ sid: "1", author: SPEAKER })], BISHOP_A)).toBeNull();
  });
});
