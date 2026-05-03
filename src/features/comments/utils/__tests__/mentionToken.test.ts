import { describe, expect, it } from "vitest";
import { activeMentionToken, applyMention } from "../mentionToken";

describe("activeMentionToken", () => {
  it("returns null when there is no @ before the caret", () => {
    expect(activeMentionToken("hello world", 11)).toBeNull();
  });

  it("returns the empty token immediately after typing @", () => {
    expect(activeMentionToken("hello @", 7)).toBe("");
  });

  it("returns the partial token while the user is typing", () => {
    expect(activeMentionToken("hello @al", 9)).toBe("al");
  });

  it("returns the @-rooted token at the start of the body", () => {
    expect(activeMentionToken("@bo", 3)).toBe("bo");
  });

  it("ends the token at the first whitespace", () => {
    // Caret is past the space — token closed.
    expect(activeMentionToken("hello @al ", 10)).toBeNull();
  });

  it("ignores @ that is part of an email address", () => {
    expect(activeMentionToken("ping me@b.com", 13)).toBeNull();
  });

  it("respects the caret when there's later text", () => {
    // "hello @al rest" — caret right after "@al", with " rest" trailing.
    expect(activeMentionToken("hello @al rest", 9)).toBe("al");
  });
});

describe("applyMention", () => {
  it("replaces the partial token with the full display name + space", () => {
    const result = applyMention("hi @al", 6, "al", "Alice");
    expect(result.value).toBe("hi @Alice ");
    expect(result.caret).toBe("hi @Alice ".length);
  });

  it("preserves text after the caret", () => {
    // Caret in the middle of the body, partial @token before it.
    const result = applyMention("hi @al rest", 6, "al", "Alice");
    expect(result.value).toBe("hi @Alice  rest");
    expect(result.caret).toBe("hi @Alice ".length);
  });

  it("handles the empty-token case (just typed @)", () => {
    const result = applyMention("hi @", 4, "", "Alice");
    expect(result.value).toBe("hi @Alice ");
    expect(result.caret).toBe("hi @Alice ".length);
  });

  it("returns the original value when the caret/token alignment is off", () => {
    // Caret says "@al" but the body says "hi al"; defensive no-op.
    const result = applyMention("hi al", 5, "al", "Alice");
    expect(result.value).toBe("hi al");
    expect(result.caret).toBe(5);
  });
});
