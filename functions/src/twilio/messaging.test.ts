import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const messagesCreate = vi.fn();
vi.mock("./client.js", () => ({
  getTwilioClient: () => ({ messages: { create: messagesCreate } }),
}));
vi.mock("firebase-functions/v2", () => ({ logger: { info: vi.fn() } }));

import { sendSmsDirect } from "./messaging.js";

describe("sendSmsDirect dev stub", () => {
  const originalEnv = { ...process.env };
  beforeEach(() => {
    messagesCreate.mockReset();
    process.env = { ...originalEnv };
  });
  afterEach(() => {
    process.env = originalEnv;
  });

  it("skips Twilio and returns a stub SID when STEWARD_DEV_STUB_SMS is true", async () => {
    process.env.STEWARD_DEV_STUB_SMS = "true";
    const sid = await sendSmsDirect({ to: "+15551234567", body: "hello https://x.test/abc" });
    expect(sid).toMatch(/^SM_stub_/);
    expect(messagesCreate).not.toHaveBeenCalled();
  });

  it("calls Twilio when STEWARD_DEV_STUB_SMS is absent", async () => {
    delete process.env.STEWARD_DEV_STUB_SMS;
    process.env.TWILIO_FROM_NUMBER = "+15550000000";
    messagesCreate.mockResolvedValue({ sid: "SMreal" });
    const sid = await sendSmsDirect({ to: "+15551234567", body: "hello" });
    expect(sid).toBe("SMreal");
    expect(messagesCreate).toHaveBeenCalledWith({
      to: "+15551234567",
      from: "+15550000000",
      body: "hello",
    });
  });

  it("throws if TWILIO_FROM_NUMBER missing in non-stub mode", async () => {
    delete process.env.STEWARD_DEV_STUB_SMS;
    delete process.env.TWILIO_FROM_NUMBER;
    await expect(sendSmsDirect({ to: "+15551234567", body: "hi" })).rejects.toThrow(
      /TWILIO_FROM_NUMBER/,
    );
  });
});
