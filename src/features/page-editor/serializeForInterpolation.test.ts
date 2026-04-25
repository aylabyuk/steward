import type { SerializedEditorState } from "lexical";
import { describe, expect, it } from "vitest";
import { legacyFieldsFromState, serializeForInterpolation } from "./serializeForInterpolation";

function state(children: object[]): SerializedEditorState {
  return {
    root: {
      type: "root",
      version: 1,
      direction: null,
      format: "",
      indent: 0,
      children,
    },
  } as unknown as SerializedEditorState;
}

function paragraph(...inline: object[]) {
  return { type: "paragraph", version: 1, children: inline };
}
function text(t: string, format = 0) {
  return { type: "text", version: 1, text: t, format };
}
function chip(token: string) {
  return { type: "variable-chip", version: 1, token };
}
function callout() {
  return { type: "assigned-sunday-callout", version: 1 };
}
function signature(closing = "With gratitude,", signatory = "The Bishopric") {
  return { type: "signature-block", version: 1, closing, signatory };
}

describe("serializeForInterpolation", () => {
  it("emits paragraphs joined by blank lines", () => {
    const s = state([paragraph(text("Hello")), paragraph(text("World"))]);
    expect(serializeForInterpolation(s)).toBe("Hello\n\nWorld");
  });

  it("emits variable chips as {{token}} text", () => {
    const s = state([paragraph(text("Dear "), chip("speakerName"), text(","))]);
    expect(serializeForInterpolation(s)).toBe("Dear {{speakerName}},");
  });

  it("emits assigned-Sunday callout as bold {{date}} for email/SMS paths", () => {
    const s = state([paragraph(text("First")), callout(), paragraph(text("After"))]);
    expect(serializeForInterpolation(s)).toBe("First\n\n**{{date}}**\n\nAfter");
  });

  it("emits signature block as closing + signatory paragraphs", () => {
    const s = state([paragraph(text("Body")), signature("In faith,", "Bishop Reeves")]);
    expect(serializeForInterpolation(s)).toBe("Body\n\nIn faith,\n\nBishop Reeves");
  });
});

describe("legacyFieldsFromState", () => {
  it("splits at the signature block — body before, footer is the last paragraph after", () => {
    const s = state([
      paragraph(text("Greeting")),
      paragraph(text("Body")),
      signature(),
      paragraph(text("Closing scripture")),
    ]);
    expect(legacyFieldsFromState(s)).toEqual({
      bodyMarkdown: "Greeting\n\nBody",
      footerMarkdown: "Closing scripture",
    });
  });

  it("omits the assigned-Sunday callout from the body — print chrome already inserts it", () => {
    const s = state([
      paragraph(text("Dear "), chip("speakerName"), text(",")),
      callout(),
      paragraph(text("Topic: "), chip("topic")),
      signature(),
      paragraph(text("Scripture")),
    ]);
    expect(legacyFieldsFromState(s)).toEqual({
      bodyMarkdown: "Dear {{speakerName}},\n\nTopic: {{topic}}",
      footerMarkdown: "Scripture",
    });
  });

  it("returns empty footer when no post-signature paragraph exists", () => {
    const s = state([paragraph(text("Body")), signature()]);
    expect(legacyFieldsFromState(s)).toEqual({ bodyMarkdown: "Body", footerMarkdown: "" });
  });

  it("treats all blocks as body when no signature-block exists", () => {
    const s = state([paragraph(text("A")), paragraph(text("B"))]);
    expect(legacyFieldsFromState(s)).toEqual({
      bodyMarkdown: "A\n\nB",
      footerMarkdown: "",
    });
  });

  it("carries multiple post-signature paragraphs into the body — only the last is the footer", () => {
    const s = state([
      paragraph(text("Body")),
      signature(),
      paragraph(text("Carry")),
      paragraph(text("Final")),
    ]);
    expect(legacyFieldsFromState(s)).toEqual({
      bodyMarkdown: "Body\n\nCarry",
      footerMarkdown: "Final",
    });
  });
});
