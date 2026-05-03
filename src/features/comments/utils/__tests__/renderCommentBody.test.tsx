import { describe, expect, it } from "vitest";
import { isValidElement, type ReactNode } from "react";
import type { WithId } from "@/hooks/_sub";
import type { Member } from "@/lib/types";
import { renderCommentBody } from "../renderCommentBody";

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

function nodeText(n: ReactNode): string {
  if (typeof n === "string") return n;
  if (isValidElement<{ children?: ReactNode }>(n)) {
    const child = n.props.children;
    return Array.isArray(child) ? child.map(nodeText).join("") : nodeText(child);
  }
  return "";
}

function nodeIsMention(n: ReactNode): boolean {
  return isValidElement(n) && (n.type as unknown) === "span";
}

describe("renderCommentBody", () => {
  it("returns the raw body when there are no members or mentions", () => {
    expect(renderCommentBody("hi", [])).toEqual(["hi"]);
    expect(renderCommentBody("hi", [mk("u1", "Alice")])).toEqual(["hi"]);
  });

  it("wraps a simple @Name in a styled span", () => {
    const out = renderCommentBody("hi @Alice!", [mk("u1", "Alice")]);
    expect(out.map(nodeText).join("")).toBe("hi @Alice!");
    expect(out.filter(nodeIsMention)).toHaveLength(1);
  });

  it("prefers the longer match when names overlap", () => {
    const members = [mk("u1", "Alice"), mk("u2", "Alice Smith")];
    const out = renderCommentBody("@Alice Smith said hi", members);
    const mentions = out.filter(nodeIsMention);
    expect(mentions).toHaveLength(1);
    expect(nodeText(mentions[0]!)).toBe("@Alice Smith");
  });

  it("highlights multiple mentions in one body", () => {
    const out = renderCommentBody("@Alice and @Bob agree.", [mk("u1", "Alice"), mk("u2", "Bob")]);
    const mentions = out.filter(nodeIsMention);
    expect(mentions.map(nodeText)).toEqual(["@Alice", "@Bob"]);
  });

  it("ignores inactive members", () => {
    const out = renderCommentBody("@Alice ?", [mk("u1", "Alice", false)]);
    expect(out.filter(nodeIsMention)).toHaveLength(0);
  });
});
