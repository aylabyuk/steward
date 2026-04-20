import { describe, expect, it } from "vitest";
import { buildMailto } from "./buildMailto";

describe("buildMailto", () => {
  it("builds a basic mailto with to, subject, body", () => {
    const url = buildMailto({
      to: "alice@example.com",
      cc: [],
      subject: "Hi",
      body: "Hello",
    });
    expect(url).toBe("mailto:alice%40example.com?subject=Hi&body=Hello");
  });

  it("omits the cc param when cc is empty", () => {
    const url = buildMailto({ to: "a@b.com", cc: [], subject: "s", body: "b" });
    expect(url).not.toContain("cc=");
  });

  it("joins cc recipients with a comma and lowercases them", () => {
    const url = buildMailto({
      to: "alice@example.com",
      cc: ["Bob@example.com", "carol@Example.com"],
      subject: "",
      body: "b",
    });
    expect(url).toContain("cc=bob%40example.com,carol%40example.com");
  });

  it("dedupes cc recipients case-insensitively", () => {
    const url = buildMailto({
      to: "a@b.com",
      cc: ["alice@example.com", "ALICE@example.com", "bob@example.com"],
      subject: "",
      body: "b",
    });
    const count = (url.match(/alice%40example\.com/g) ?? []).length;
    expect(count).toBe(1);
  });

  it("percent-encodes special characters in subject and body", () => {
    const url = buildMailto({
      to: "a@b.com",
      cc: [],
      subject: "Hi & stuff",
      body: "line 1\nline 2",
    });
    expect(url).toContain("subject=Hi%20%26%20stuff");
    expect(url).toContain("body=line%201%0Aline%202");
  });

  it("truncates body when the URL would exceed the mailto cap", () => {
    const longBody = "x".repeat(10_000);
    const url = buildMailto({ to: "a@b.com", cc: [], subject: "s", body: longBody });
    expect(url.length).toBeLessThanOrEqual(1800);
    expect(url).toContain("%5Btruncated%5D");
  });

  it("keeps non-truncating URLs under the cap unchanged", () => {
    const body = "ok";
    const url = buildMailto({ to: "a@b.com", cc: [], subject: "s", body });
    expect(url).not.toContain("truncated");
  });
});
