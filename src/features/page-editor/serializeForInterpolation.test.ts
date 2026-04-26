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
function letterhead(eyebrow: string, title: string, subtitle: string) {
  return { type: "letterhead", version: 2, eyebrow, title, subtitle };
}
function calloutBlock(label: string, body: string) {
  return { type: "callout", version: 1, label, body };
}
function image(src: string, alt: string) {
  return { type: "image", version: 1, src, alt, widthPct: 60 };
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

  it("emits letterhead as eyebrow / # title / subtitle, preserving {{tokens}}", () => {
    const s = state([
      letterhead("Sacrament Meeting · {{wardName}}", "Invitation to Speak", "From the Bishopric"),
      paragraph(text("After")),
    ]);
    expect(serializeForInterpolation(s)).toBe(
      "Sacrament Meeting · {{wardName}}\n\n# Invitation to Speak\n\nFrom the Bishopric\n\nAfter",
    );
  });

  it("emits generic callout as bold label + body", () => {
    const s = state([calloutBlock("Note", "Bring a recommend"), paragraph(text("After"))]);
    expect(serializeForInterpolation(s)).toBe("**Note**\n\nBring a recommend\n\nAfter");
  });

  it("emits callout with empty body as just bold label", () => {
    const s = state([calloutBlock("Topic", "")]);
    expect(serializeForInterpolation(s)).toBe("**Topic**");
  });

  it("emits image as markdown image syntax", () => {
    const s = state([image("https://example.com/x.png", "alt")]);
    expect(serializeForInterpolation(s)).toBe("![alt](https://example.com/x.png)");
  });

  it("omits image with empty src so a placeholder doesn't leak into the email", () => {
    const s = state([image("", "alt"), paragraph(text("Body"))]);
    expect(serializeForInterpolation(s)).toBe("Body");
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

  it("preserves letterhead + generic callout in the body — they are content, not chrome (regression)", () => {
    // Repro for the bug where the bishop's saved template (with a
    // LetterheadNode masthead + Callout block) was sent to speakers
    // missing both nodes — the serializer's default-case dropped them
    // silently, leaving the email with only paragraphs.
    const s = state([
      letterhead("Sacrament Meeting · {{wardName}}", "Invitation to Speak", "From the Bishopric"),
      paragraph(text("Dear "), chip("speakerName"), text(",")),
      calloutBlock("Topic", "{{topic}}"),
      signature(),
      paragraph(text("Scripture")),
    ]);
    const { bodyMarkdown, footerMarkdown } = legacyFieldsFromState(s);
    expect(bodyMarkdown).toContain("Invitation to Speak");
    expect(bodyMarkdown).toContain("Sacrament Meeting · {{wardName}}");
    expect(bodyMarkdown).toContain("**Topic**");
    expect(bodyMarkdown).toContain("Dear {{speakerName}},");
    expect(footerMarkdown).toBe("Scripture");
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
