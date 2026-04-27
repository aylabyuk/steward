import { describe, expect, it } from "vitest";
import { interpolate } from "../interpolate";

describe("interpolate", () => {
  it("replaces a single variable", () => {
    expect(interpolate("Dear {{speakerName}},", { speakerName: "Sebastian Tan" })).toBe(
      "Dear Sebastian Tan,",
    );
  });

  it("replaces multiple variables in one pass", () => {
    const t = "{{wardName}} — {{date}} — {{speakerName}}";
    expect(
      interpolate(t, {
        wardName: "Eglinton Ward",
        date: "Sunday, April 26, 2026",
        speakerName: "Brother Bore Boring",
      }),
    ).toBe("Eglinton Ward — Sunday, April 26, 2026 — Brother Bore Boring");
  });

  it("tolerates whitespace inside the braces", () => {
    expect(interpolate("{{ name }} vs {{name}}", { name: "Alice" })).toBe("Alice vs Alice");
  });

  it("leaves unknown variables literally in the output", () => {
    // Missing-variable visibility is intentional: better to SHOW
    // `{{topic}}` during authoring than to quietly drop it.
    expect(interpolate("Topic: {{topic}}", { speakerName: "X" })).toBe("Topic: {{topic}}");
  });

  it("replaces the same variable multiple times", () => {
    expect(interpolate("{{name}} — {{name}} — {{name}}", { name: "Alice" })).toBe(
      "Alice — Alice — Alice",
    );
  });

  it("returns the input unchanged when no variables are present", () => {
    expect(interpolate("Plain text, no braces.", {})).toBe("Plain text, no braces.");
  });

  it("allows variable values that contain brace-like characters without re-interpolation", () => {
    expect(interpolate("{{a}}", { a: "{{b}}", b: "nope" })).toBe("{{b}}");
  });
});
