import { Timestamp } from "firebase-admin/firestore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { postMessage } = vi.hoisted(() => ({ postMessage: vi.fn() }));
vi.mock("./conversations.js", () => ({ postMessage }));
vi.mock("firebase-functions/v2", () => ({ logger: { warn: vi.fn() } }));

import { NO_MATCH_TWIML, relayInboundSms } from "./inboundSmsRelay.js";

interface DocLike {
  id: string;
  data: () => Record<string, unknown>;
}

function ts(ms: number): Timestamp {
  return Timestamp.fromMillis(ms);
}

function makeDb(docs: DocLike[]): import("firebase-admin/firestore").Firestore {
  // Minimal fake — only the methods relayInboundSms calls.
  const get = vi.fn().mockResolvedValue({ empty: docs.length === 0, docs });
  const where2 = vi.fn().mockReturnValue({ get });
  const where1 = vi.fn().mockReturnValue({ where: where2 });
  const collectionGroup = vi.fn().mockReturnValue({ where: where1 });
  return { collectionGroup } as unknown as import("firebase-admin/firestore").Firestore;
}

describe("relayInboundSms", () => {
  beforeEach(() => {
    postMessage.mockReset();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns no-active-invitation when no docs match", async () => {
    const db = makeDb([]);
    const r = await relayInboundSms(db, "+14155551111", "hello");
    expect(r).toEqual({ matched: false, reason: "no-active-invitation" });
    expect(postMessage).not.toHaveBeenCalled();
  });

  it("returns empty-body when the SMS body is whitespace", async () => {
    const db = makeDb([]);
    const r = await relayInboundSms(db, "+14155551111", "   \n  ");
    expect(r).toEqual({ matched: false, reason: "empty-body" });
  });

  it("filters out expired invitations", async () => {
    const past = ts(Date.now() - 60_000);
    const docs: DocLike[] = [
      {
        id: "expired1",
        data: () => ({
          speakerPhone: "+14155551111",
          tokenStatus: "active",
          expiresAt: past,
          conversationSid: "CHexpired",
          createdAt: ts(Date.now() - 600_000),
        }),
      },
    ];
    const db = makeDb(docs);
    const r = await relayInboundSms(db, "+14155551111", "hi");
    expect(r).toEqual({ matched: false, reason: "no-active-invitation" });
    expect(postMessage).not.toHaveBeenCalled();
  });

  it("picks most-recent createdAt when multiple non-expired invitations match", async () => {
    const future = ts(Date.now() + 60 * 60_000);
    const docs: DocLike[] = [
      {
        id: "older",
        data: () => ({
          speakerPhone: "+14155551111",
          tokenStatus: "active",
          expiresAt: future,
          conversationSid: "CHolder",
          createdAt: ts(Date.now() - 86_400_000),
        }),
      },
      {
        id: "newer",
        data: () => ({
          speakerPhone: "+14155551111",
          tokenStatus: "active",
          expiresAt: future,
          conversationSid: "CHnewer",
          createdAt: ts(Date.now() - 60_000),
        }),
      },
    ];
    const db = makeDb(docs);
    postMessage.mockResolvedValue("IM_msg_sid");
    const r = await relayInboundSms(db, "+14155551111", "Yes I can speak");
    expect(r).toEqual({
      matched: true,
      conversationSid: "CHnewer",
      invitationId: "newer",
      messageSid: "IM_msg_sid",
    });
    expect(postMessage).toHaveBeenCalledWith({
      conversationSid: "CHnewer",
      author: "speaker:newer",
      body: "Yes I can speak",
    });
  });

  it("trims whitespace from the posted body", async () => {
    const future = ts(Date.now() + 60 * 60_000);
    const docs: DocLike[] = [
      {
        id: "inv1",
        data: () => ({
          speakerPhone: "+14155551111",
          tokenStatus: "active",
          expiresAt: future,
          conversationSid: "CHinv1",
          createdAt: ts(Date.now()),
        }),
      },
    ];
    const db = makeDb(docs);
    postMessage.mockResolvedValue("IM_sid");
    await relayInboundSms(db, "+14155551111", "  hi there \n");
    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({ body: "hi there" }));
  });

  it("returns no-conversation when matched doc lacks conversationSid", async () => {
    const future = ts(Date.now() + 60 * 60_000);
    const docs: DocLike[] = [
      {
        id: "inv1",
        data: () => ({
          speakerPhone: "+14155551111",
          tokenStatus: "active",
          expiresAt: future,
          createdAt: ts(Date.now()),
        }),
      },
    ];
    const db = makeDb(docs);
    const r = await relayInboundSms(db, "+14155551111", "hi");
    expect(r).toEqual({ matched: false, reason: "no-conversation" });
    expect(postMessage).not.toHaveBeenCalled();
  });
});

describe("NO_MATCH_TWIML", () => {
  it("is a valid TwiML Response with a Message child", () => {
    expect(NO_MATCH_TWIML).toContain("<Response>");
    expect(NO_MATCH_TWIML).toContain("<Message>");
    expect(NO_MATCH_TWIML).toContain("</Response>");
  });
});
