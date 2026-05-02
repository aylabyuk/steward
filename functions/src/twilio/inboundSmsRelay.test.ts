import { Timestamp } from "firebase-admin/firestore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { postMessage } = vi.hoisted(() => ({ postMessage: vi.fn() }));
vi.mock("./conversations.js", () => ({ postMessage }));
vi.mock("firebase-functions/v2", () => ({ logger: { warn: vi.fn() } }));

import { NO_MATCH_TWIML, relayInboundSms } from "./inboundSmsRelay.js";

interface TestRow {
  /** Parent doc id (= invitation id) and `auth` is the subdoc id under
   *  it. The relay filters by `auth` doc id; pass a different id to
   *  cover the "doc in a `private` subcollection but not the auth
   *  subdoc" path. */
  id: string;
  authId?: string;
  parent: Record<string, unknown>;
  auth: Record<string, unknown>;
}

function ts(ms: number): Timestamp {
  return Timestamp.fromMillis(ms);
}

/** Build a fake Firestore that mirrors the post-doc-split read shape:
 *
 *    db.collectionGroup("private")
 *      .where("speakerPhone", ...)
 *      .where("tokenStatus", ...)
 *      .get()                       // returns auth subdocs
 *
 *    authDoc.ref.parent.parent.get() // returns the parent invitation
 *
 *  Each `TestRow` becomes one auth subdoc whose `ref.parent.parent`
 *  resolves to a parent snap carrying `row.parent`. */
function makeDb(rows: TestRow[]): import("firebase-admin/firestore").Firestore {
  const authDocs = rows.map((row) => {
    const parentSnap = {
      exists: true,
      id: row.id,
      data: () => row.parent,
    };
    const parentRef = {
      get: vi.fn().mockResolvedValue(parentSnap),
    };
    return {
      id: row.authId ?? "auth",
      data: () => row.auth,
      ref: { parent: { parent: parentRef } },
    };
  });
  const get = vi.fn().mockResolvedValue({ empty: rows.length === 0, docs: authDocs });
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
    const db = makeDb([
      {
        id: "expired1",
        parent: {
          conversationSid: "CHexpired",
          expiresAt: past,
          createdAt: ts(Date.now() - 600_000),
        },
        auth: { speakerPhone: "+14155551111", tokenStatus: "active" },
      },
    ]);
    const r = await relayInboundSms(db, "+14155551111", "hi");
    expect(r).toEqual({ matched: false, reason: "no-active-invitation" });
    expect(postMessage).not.toHaveBeenCalled();
  });

  it("picks most-recent createdAt when multiple non-expired invitations match", async () => {
    const future = ts(Date.now() + 60 * 60_000);
    const db = makeDb([
      {
        id: "older",
        parent: {
          conversationSid: "CHolder",
          expiresAt: future,
          createdAt: ts(Date.now() - 86_400_000),
        },
        auth: { speakerPhone: "+14155551111", tokenStatus: "active" },
      },
      {
        id: "newer",
        parent: {
          conversationSid: "CHnewer",
          expiresAt: future,
          createdAt: ts(Date.now() - 60_000),
        },
        auth: { speakerPhone: "+14155551111", tokenStatus: "active" },
      },
    ]);
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
    const db = makeDb([
      {
        id: "inv1",
        parent: { conversationSid: "CHinv1", expiresAt: future, createdAt: ts(Date.now()) },
        auth: { speakerPhone: "+14155551111", tokenStatus: "active" },
      },
    ]);
    postMessage.mockResolvedValue("IM_sid");
    await relayInboundSms(db, "+14155551111", "  hi there \n");
    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({ body: "hi there" }));
  });

  it("returns no-conversation when matched doc lacks conversationSid", async () => {
    const future = ts(Date.now() + 60 * 60_000);
    const db = makeDb([
      {
        id: "inv1",
        parent: { expiresAt: future, createdAt: ts(Date.now()) },
        auth: { speakerPhone: "+14155551111", tokenStatus: "active" },
      },
    ]);
    const r = await relayInboundSms(db, "+14155551111", "hi");
    expect(r).toEqual({ matched: false, reason: "no-conversation" });
    expect(postMessage).not.toHaveBeenCalled();
  });

  it("ignores docs in a `private` subcollection that aren't the auth subdoc", async () => {
    const future = ts(Date.now() + 60 * 60_000);
    const db = makeDb([
      {
        id: "inv1",
        authId: "not-auth",
        parent: { conversationSid: "CHinv1", expiresAt: future, createdAt: ts(Date.now()) },
        auth: { speakerPhone: "+14155551111", tokenStatus: "active" },
      },
    ]);
    const r = await relayInboundSms(db, "+14155551111", "hi");
    expect(r).toEqual({ matched: false, reason: "no-active-invitation" });
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
