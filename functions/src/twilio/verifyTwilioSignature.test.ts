import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { validateRequest, loggerWarn } = vi.hoisted(() => ({
  validateRequest: vi.fn(),
  loggerWarn: vi.fn(),
}));
vi.mock("twilio", () => ({ default: { validateRequest } }));
vi.mock("firebase-functions/v2", () => ({ logger: { warn: loggerWarn } }));

import { verifyTwilioSignature } from "./verifyTwilioSignature.js";

describe("verifyTwilioSignature", () => {
  beforeEach(() => {
    validateRequest.mockReset();
    loggerWarn.mockReset();
  });
  afterEach(() => {
    validateRequest.mockReset();
    loggerWarn.mockReset();
  });

  it("returns true and skips logging when Twilio's library accepts the signature", () => {
    validateRequest.mockReturnValue(true);
    const ok = verifyTwilioSignature({
      signature: "sig-abc",
      authToken: "token-xyz",
      url: "https://example.cloudfunctions.net/onTwilioWebhook",
      params: { ConversationSid: "CHabc" },
    });
    expect(ok).toBe(true);
    expect(validateRequest).toHaveBeenCalledWith(
      "token-xyz",
      "sig-abc",
      "https://example.cloudfunctions.net/onTwilioWebhook",
      { ConversationSid: "CHabc" },
    );
    expect(loggerWarn).not.toHaveBeenCalled();
  });

  it("returns false and logs `missing-header` when the signature is undefined", () => {
    const ok = verifyTwilioSignature({
      signature: undefined,
      authToken: "token-xyz",
      url: "https://example/x",
      params: {},
    });
    expect(ok).toBe(false);
    expect(validateRequest).not.toHaveBeenCalled();
    expect(loggerWarn).toHaveBeenCalledWith("twilio.webhook.signature_failed", {
      reason: "missing-header",
    });
  });

  it("returns false and logs `missing-auth-token` when the env var isn't injected", () => {
    const ok = verifyTwilioSignature({
      signature: "sig-abc",
      authToken: undefined,
      url: "https://example/x",
      params: {},
    });
    expect(ok).toBe(false);
    expect(validateRequest).not.toHaveBeenCalled();
    expect(loggerWarn).toHaveBeenCalledWith("twilio.webhook.signature_failed", {
      reason: "missing-auth-token",
    });
  });

  it("returns false and logs `invalid` when Twilio's library rejects", () => {
    validateRequest.mockReturnValue(false);
    const ok = verifyTwilioSignature({
      signature: "sig-tampered",
      authToken: "token-xyz",
      url: "https://example/x",
      params: { Body: "Hello" },
    });
    expect(ok).toBe(false);
    expect(loggerWarn).toHaveBeenCalledWith("twilio.webhook.signature_failed", {
      reason: "invalid",
    });
  });

  it("passes the URL through verbatim — no normalisation, query string preserved", () => {
    validateRequest.mockReturnValue(true);
    verifyTwilioSignature({
      signature: "s",
      authToken: "t",
      url: "https://example/x?a=1&b=2",
      params: {},
    });
    expect(validateRequest).toHaveBeenCalledWith("t", "s", "https://example/x?a=1&b=2", {});
  });
});
