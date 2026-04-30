import { describe, it, expect } from "vitest";
import {
  formatResponseBody,
  formatResponsePrompt,
  formatYesButtonLabel,
} from "../quickResponseCopy";

describe("quickResponseCopy", () => {
  describe("formatResponseBody", () => {
    it("speaker yes → 'Yes, I can speak.'", () => {
      expect(formatResponseBody({ answer: "yes", kind: "speaker" })).toBe("Yes, I can speak.");
    });

    it("prayer yes → 'Yes, I can offer the prayer.'", () => {
      expect(formatResponseBody({ answer: "yes", kind: "prayer" })).toBe(
        "Yes, I can offer the prayer.",
      );
    });

    it("no without reason → 'No, I can't.' regardless of kind", () => {
      expect(formatResponseBody({ answer: "no", kind: "speaker" })).toBe("No, I can't.");
      expect(formatResponseBody({ answer: "no", kind: "prayer" })).toBe("No, I can't.");
    });

    it("no with reason → 'No — {reason}' regardless of kind", () => {
      expect(
        formatResponseBody({
          answer: "no",
          kind: "speaker",
          reasonText: "out of town",
        }),
      ).toBe("No — out of town");
      expect(
        formatResponseBody({
          answer: "no",
          kind: "prayer",
          reasonText: "out of town",
        }),
      ).toBe("No — out of town");
    });
  });

  describe("formatResponsePrompt", () => {
    it("speaker → 'Can you speak on …?'", () => {
      expect(formatResponsePrompt({ kind: "speaker", shortSunday: "Sun May 17" })).toBe(
        "Can you speak on Sun May 17?",
      );
    });

    it("prayer → 'Can you offer the prayer on …?'", () => {
      expect(formatResponsePrompt({ kind: "prayer", shortSunday: "Sun May 17" })).toBe(
        "Can you offer the prayer on Sun May 17?",
      );
    });
  });

  describe("formatYesButtonLabel", () => {
    it("speaker → 'Yes, I can speak'", () => {
      expect(formatYesButtonLabel("speaker")).toBe("Yes, I can speak");
    });

    it("prayer → 'Yes, I can offer the prayer'", () => {
      expect(formatYesButtonLabel("prayer")).toBe("Yes, I can offer the prayer");
    });
  });
});
