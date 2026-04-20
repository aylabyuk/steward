import { describe, expect, it } from "vitest";
import { renderTemplate } from "./renderTemplate";

describe("renderTemplate", () => {
  it("replaces a single placeholder", () => {
    expect(renderTemplate("Hi {{speakerName}}", { speakerName: "Alice" })).toBe("Hi Alice");
  });

  it("replaces multiple placeholders, including repeats", () => {
    const out = renderTemplate("{{a}} and {{b}} and {{a}}", { a: "X", b: "Y" });
    expect(out).toBe("X and Y and X");
  });

  it("leaves unknown placeholders intact so typos are visible", () => {
    expect(renderTemplate("Hello {{speaker_name}}", { speakerName: "Alice" })).toBe(
      "Hello {{speaker_name}}",
    );
  });

  it("leaves empty-string values as visible placeholders", () => {
    expect(renderTemplate("Topic: {{topic}}", { topic: "" })).toBe("Topic: {{topic}}");
  });

  it("coerces numbers to strings", () => {
    expect(renderTemplate("{{dayCount}} days", { dayCount: 14 })).toBe("14 days");
  });

  it("leaves the template alone when values is empty", () => {
    expect(renderTemplate("{{a}} {{b}}", {})).toBe("{{a}} {{b}}");
  });
});
