import { describe, expect, it } from "vitest";
import { blobToBase64 } from "../useEmbedShareBridge";

describe("blobToBase64", () => {
  it("strips the `data:...;base64,` prefix and returns the raw payload", async () => {
    const blob = new Blob(["hello world"], { type: "text/plain" });
    const out = await blobToBase64(blob);
    // base64('hello world') === 'aGVsbG8gd29ybGQ='
    expect(out).toBe("aGVsbG8gd29ybGQ=");
  });

  it("round-trips arbitrary bytes intact", async () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // "%PDF-1.4"
    const blob = new Blob([bytes], { type: "application/pdf" });
    const out = await blobToBase64(blob);
    const decoded = atob(out);
    const decodedBytes = Uint8Array.from(decoded, (c) => c.charCodeAt(0));
    expect(Array.from(decodedBytes)).toEqual(Array.from(bytes));
  });
});
