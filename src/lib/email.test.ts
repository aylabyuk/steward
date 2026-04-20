import { describe, expect, it } from "vitest";
import { isValidEmail } from "./email";

describe("isValidEmail", () => {
  it("accepts common formats", () => {
    expect(isValidEmail("jean@gmail.com")).toBe(true);
    expect(isValidEmail("first.last@example.co.uk")).toBe(true);
    expect(isValidEmail("user+tag@sub.domain.org")).toBe(true);
  });

  it("rejects empty and whitespace-only strings", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("   ")).toBe(false);
  });

  it("rejects strings missing an @ or TLD", () => {
    expect(isValidEmail("plainaddress")).toBe(false);
    expect(isValidEmail("missingdomain@")).toBe(false);
    expect(isValidEmail("@missinguser.com")).toBe(false);
    expect(isValidEmail("user@nodot")).toBe(false);
  });

  it("rejects strings with spaces", () => {
    expect(isValidEmail("user name@example.com")).toBe(false);
    expect(isValidEmail("user@exa mple.com")).toBe(false);
  });

  it("trims surrounding whitespace before validating", () => {
    expect(isValidEmail("  jean@gmail.com  ")).toBe(true);
  });
});
