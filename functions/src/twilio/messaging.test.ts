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

  it("calls Twilio with raw from number when no messaging service configured", async () => {
    delete process.env.STEWARD_DEV_STUB_SMS;
    delete process.env.TWILIO_MESSAGING_SERVICE_SID;
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

  it("routes through messagingServiceSid when TWILIO_MESSAGING_SERVICE_SID is set (production)", async () => {
    delete process.env.STEWARD_DEV_STUB_SMS;
    process.env.TWILIO_FROM_NUMBER = "+15550000000";
    process.env.TWILIO_MESSAGING_SERVICE_SID = "MGabc123";
    messagesCreate.mockResolvedValue({ sid: "SMservice" });
    const sid = await sendSmsDirect({ to: "+15551234567", body: "hello" });
    expect(sid).toBe("SMservice");
    expect(messagesCreate).toHaveBeenCalledWith({
      to: "+15551234567",
      messagingServiceSid: "MGabc123",
      body: "hello",
    });
    // No raw `from` when routing through the service.
    expect(messagesCreate.mock.calls[0]?.[0]).not.toHaveProperty("from");
  });

  it("throws if TWILIO_FROM_NUMBER missing in non-stub mode without messaging service", async () => {
    delete process.env.STEWARD_DEV_STUB_SMS;
    delete process.env.TWILIO_MESSAGING_SERVICE_SID;
    delete process.env.TWILIO_FROM_NUMBER;
    await expect(sendSmsDirect({ to: "+15551234567", body: "hi" })).rejects.toThrow(
      /TWILIO_FROM_NUMBER/,
    );
  });

  it("does NOT require TWILIO_FROM_NUMBER when messaging service is set", async () => {
    delete process.env.STEWARD_DEV_STUB_SMS;
    delete process.env.TWILIO_FROM_NUMBER;
    process.env.TWILIO_MESSAGING_SERVICE_SID = "MGabc123";
    messagesCreate.mockResolvedValue({ sid: "SMservice" });
    const sid = await sendSmsDirect({ to: "+15551234567", body: "hi" });
    expect(sid).toBe("SMservice");
  });

  it("uses TWILIO_FROM_NUMBER_TESTING when fromMode is 'testing'", async () => {
    delete process.env.STEWARD_DEV_STUB_SMS;
    process.env.TWILIO_FROM_NUMBER = "+15550000000";
    process.env.TWILIO_FROM_NUMBER_TESTING = "+15559999999";
    messagesCreate.mockResolvedValue({ sid: "SMtest" });
    const sid = await sendSmsDirect({
      to: "+15551234567",
      body: "hi",
      fromMode: "testing",
    });
    expect(sid).toBe("SMtest");
    expect(messagesCreate).toHaveBeenCalledWith({
      to: "+15551234567",
      from: "+15559999999",
      body: "hi",
    });
  });

  it("throws if testing requested but TWILIO_FROM_NUMBER_TESTING missing", async () => {
    delete process.env.STEWARD_DEV_STUB_SMS;
    process.env.TWILIO_FROM_NUMBER = "+15550000000";
    delete process.env.TWILIO_FROM_NUMBER_TESTING;
    await expect(
      sendSmsDirect({ to: "+15551234567", body: "hi", fromMode: "testing" }),
    ).rejects.toThrow(/TWILIO_FROM_NUMBER_TESTING/);
  });
});
