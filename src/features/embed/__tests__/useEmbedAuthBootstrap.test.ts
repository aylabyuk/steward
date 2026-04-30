import { describe, expect, it } from "vitest";
import { parseTokenFromHash } from "../useEmbedAuthBootstrap";

describe("parseTokenFromHash", () => {
  it("returns null for an empty hash", () => {
    expect(parseTokenFromHash("")).toBeNull();
    expect(parseTokenFromHash("#")).toBeNull();
  });

  it("returns null when no `token` param is present", () => {
    expect(parseTokenFromHash("#foo=bar")).toBeNull();
  });

  it("extracts the token from `#token=<jwt>`", () => {
    expect(parseTokenFromHash("#token=abc.def.ghi")).toBe("abc.def.ghi");
  });

  it("extracts the token regardless of leading `#`", () => {
    expect(parseTokenFromHash("token=plain")).toBe("plain");
  });

  it("treats an empty token value as absent", () => {
    expect(parseTokenFromHash("#token=")).toBeNull();
  });

  it("ignores other params alongside the token", () => {
    expect(parseTokenFromHash("#foo=1&token=jwt&bar=2")).toBe("jwt");
  });
});
