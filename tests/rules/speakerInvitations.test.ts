import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { authedAs, authedAsSpeaker, createTestEnv, seedMember, seedWard } from "./_helpers";

const WARD = "w1";
const INVITATION_ID = "ABC123abcDEF456";
const PARENT_PATH = `wards/${WARD}/speakerInvitations/${INVITATION_ID}`;
const AUTH_PATH = `${PARENT_PATH}/private/auth`;
const SPEAKER_UID = `speaker:${WARD}:${INVITATION_ID}`;
const FUTURE = Timestamp.fromDate(new Date("2099-12-31T00:00:00Z"));
const PAST = Timestamp.fromDate(new Date("2000-01-01T00:00:00Z"));

const sampleParent = {
  speakerRef: { meetingDate: "2026-04-26", speakerId: "s1" },
  assignedDate: "Sunday, April 26, 2026",
  sentOn: "April 21, 2026",
  wardName: "Eglinton Ward",
  speakerName: "Sebastian Tan",
  speakerTopic: "Repentance",
  inviterName: "Bishop Paul",
  bodyMarkdown: "Dear Sebastian Tan, …",
  footerMarkdown: "And all things whatsoever …",
  expiresAt: FUTURE,
};

const sampleAuth = {
  tokenHash: "abc",
  tokenStatus: "active" as const,
  tokenExpiresAt: FUTURE,
  speakerEmail: "speaker@example.com",
  speakerPhone: "+15551234567",
  bishopricParticipants: [],
  deliveryRecord: [],
};

async function seedSplit(
  env: RulesTestEnvironment,
  opts: {
    parent?: Partial<typeof sampleParent>;
    auth?: Partial<typeof sampleAuth> & {
      response?: Record<string, unknown>;
      speakerLastSeenAt?: unknown;
    };
  } = {},
) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), PARENT_PATH), { ...sampleParent, ...opts.parent });
    await setDoc(doc(ctx.firestore(), AUTH_PATH), { ...sampleAuth, ...opts.auth });
  });
}

describe("speakerInvitations rules — public parent doc", () => {
  let env: RulesTestEnvironment;
  beforeAll(async () => {
    env = await createTestEnv();
  });
  afterAll(async () => {
    await env.cleanup();
  });
  beforeEach(async () => {
    await env.clearFirestore();
    await seedWard(env, WARD);
    await seedMember(env, { wardId: WARD, uid: "bishop", email: "b@x.com", role: "bishopric" });
    await seedMember(env, { wardId: WARD, uid: "clerk", email: "c@x.com", role: "clerk" });
  });

  describe("read", () => {
    it("anonymous user can read the parent doc", async () => {
      await seedSplit(env);
      const db = env.unauthenticatedContext().firestore();
      await assertSucceeds(getDoc(doc(db, PARENT_PATH)));
    });

    it("signed-in non-member can read the parent doc", async () => {
      await seedSplit(env);
      const db = authedAs(env, "stranger", "s@x.com").firestore();
      await assertSucceeds(getDoc(doc(db, PARENT_PATH)));
    });
  });

  describe("create / delete", () => {
    it("active bishopric member can create the parent doc", async () => {
      const db = authedAs(env, "bishop", "b@x.com").firestore();
      await assertSucceeds(setDoc(doc(db, PARENT_PATH), sampleParent));
    });

    it("active clerk can create the parent doc", async () => {
      const db = authedAs(env, "clerk", "c@x.com").firestore();
      await assertSucceeds(setDoc(doc(db, PARENT_PATH), sampleParent));
    });

    it("anonymous create blocked", async () => {
      const db = env.unauthenticatedContext().firestore();
      await assertFails(setDoc(doc(db, PARENT_PATH), sampleParent));
    });

    it("non-member create blocked", async () => {
      const db = authedAs(env, "stranger", "s@x.com").firestore();
      await assertFails(setDoc(doc(db, PARENT_PATH), sampleParent));
    });

    it("active member can delete the parent doc", async () => {
      await seedSplit(env);
      const db = authedAs(env, "clerk", "c@x.com").firestore();
      await assertSucceeds(deleteDoc(doc(db, PARENT_PATH)));
    });

    it("anonymous delete blocked", async () => {
      await seedSplit(env);
      const db = env.unauthenticatedContext().firestore();
      await assertFails(deleteDoc(doc(db, PARENT_PATH)));
    });
  });

  describe("update — speaker may only write responseSummary", () => {
    it("speaker can write responseSummary on the parent", async () => {
      await seedSplit(env);
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: INVITATION_ID,
        wardId: WARD,
      }).firestore();
      await assertSucceeds(
        updateDoc(doc(db, PARENT_PATH), {
          responseSummary: { answer: "yes", respondedAt: serverTimestamp() },
        }),
      );
    });

    it("speaker writing bodyMarkdown on the parent fails (not in hasOnly)", async () => {
      await seedSplit(env);
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: INVITATION_ID,
        wardId: WARD,
      }).firestore();
      await assertFails(updateDoc(doc(db, PARENT_PATH), { bodyMarkdown: "tampered" }));
    });

    it("speaker writing responseSummary past expiresAt fails", async () => {
      await seedSplit(env, { parent: { expiresAt: PAST } });
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: INVITATION_ID,
        wardId: WARD,
      }).firestore();
      await assertFails(
        updateDoc(doc(db, PARENT_PATH), {
          responseSummary: { answer: "yes", respondedAt: serverTimestamp() },
        }),
      );
    });

    it("speaker with mismatched invitationId claim blocked", async () => {
      await seedSplit(env);
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: "other",
        wardId: WARD,
      }).firestore();
      await assertFails(
        updateDoc(doc(db, PARENT_PATH), {
          responseSummary: { answer: "yes", respondedAt: serverTimestamp() },
        }),
      );
    });
  });

  describe("update — bishopric path", () => {
    it("active bishop can edit letter content (e.g. bodyMarkdown)", async () => {
      await seedSplit(env);
      const db = authedAs(env, "clerk", "c@x.com").firestore();
      await assertSucceeds(updateDoc(doc(db, PARENT_PATH), { bodyMarkdown: "edited" }));
    });

    it("active bishop can write currentSpeakerStatus mirror", async () => {
      await seedSplit(env);
      const db = authedAs(env, "bishop", "b@x.com").firestore();
      await assertSucceeds(
        updateDoc(doc(db, PARENT_PATH), { currentSpeakerStatus: "confirmed" }),
      );
    });
  });
});

describe("speakerInvitations rules — private auth subdoc", () => {
  let env: RulesTestEnvironment;
  beforeAll(async () => {
    env = await createTestEnv();
  });
  afterAll(async () => {
    await env.cleanup();
  });
  beforeEach(async () => {
    await env.clearFirestore();
    await seedWard(env, WARD);
    await seedMember(env, { wardId: WARD, uid: "bishop", email: "b@x.com", role: "bishopric" });
    await seedMember(env, { wardId: WARD, uid: "clerk", email: "c@x.com", role: "clerk" });
  });

  describe("read", () => {
    it("anonymous user CANNOT read the auth subdoc — the C1 gate", async () => {
      await seedSplit(env);
      const db = env.unauthenticatedContext().firestore();
      await assertFails(getDoc(doc(db, AUTH_PATH)));
    });

    it("signed-in non-member CANNOT read the auth subdoc", async () => {
      await seedSplit(env);
      const db = authedAs(env, "stranger", "s@x.com").firestore();
      await assertFails(getDoc(doc(db, AUTH_PATH)));
    });

    it("active bishop can read the auth subdoc", async () => {
      await seedSplit(env);
      const db = authedAs(env, "bishop", "b@x.com").firestore();
      await assertSucceeds(getDoc(doc(db, AUTH_PATH)));
    });

    it("active clerk can read the auth subdoc", async () => {
      await seedSplit(env);
      const db = authedAs(env, "clerk", "c@x.com").firestore();
      await assertSucceeds(getDoc(doc(db, AUTH_PATH)));
    });

    it("speaker with matching invitationId+wardId claim can read the auth subdoc", async () => {
      await seedSplit(env);
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: INVITATION_ID,
        wardId: WARD,
      }).firestore();
      await assertSucceeds(getDoc(doc(db, AUTH_PATH)));
    });

    it("speaker with mismatched invitationId claim CANNOT read", async () => {
      await seedSplit(env);
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: "other",
        wardId: WARD,
      }).firestore();
      await assertFails(getDoc(doc(db, AUTH_PATH)));
    });

    it("speaker with mismatched wardId claim CANNOT read", async () => {
      await seedSplit(env);
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: INVITATION_ID,
        wardId: "other",
      }).firestore();
      await assertFails(getDoc(doc(db, AUTH_PATH)));
    });
  });

  describe("update — speaker self-write path", () => {
    const sampleResponse = {
      answer: "yes" as const,
      respondedAt: serverTimestamp(),
      actorUid: SPEAKER_UID,
    };

    it("speaker writes response to auth subdoc", async () => {
      await seedSplit(env);
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: INVITATION_ID,
        wardId: WARD,
      }).firestore();
      await assertSucceeds(updateDoc(doc(db, AUTH_PATH), { response: sampleResponse }));
    });

    it("speaker writes speakerLastSeenAt to auth subdoc", async () => {
      await seedSplit(env);
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: INVITATION_ID,
        wardId: WARD,
      }).firestore();
      await assertSucceeds(
        updateDoc(doc(db, AUTH_PATH), { speakerLastSeenAt: serverTimestamp() }),
      );
    });

    it("speaker writing tokenHash on auth subdoc fails (not in hasOnly)", async () => {
      await seedSplit(env);
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: INVITATION_ID,
        wardId: WARD,
      }).firestore();
      await assertFails(updateDoc(doc(db, AUTH_PATH), { tokenHash: "tampered" }));
    });

    it("speaker writes past tokenExpiresAt fail", async () => {
      await seedSplit(env, { auth: { tokenExpiresAt: PAST } });
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: INVITATION_ID,
        wardId: WARD,
      }).firestore();
      await assertFails(updateDoc(doc(db, AUTH_PATH), { response: sampleResponse }));
    });

    it("speaker spoofing actorUid fails", async () => {
      await seedSplit(env);
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: INVITATION_ID,
        wardId: WARD,
      }).firestore();
      await assertFails(
        updateDoc(doc(db, AUTH_PATH), {
          response: { ...sampleResponse, actorUid: "bishop" },
        }),
      );
    });

    it("speaker mismatched-claim write fails", async () => {
      await seedSplit(env);
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: "other",
        wardId: WARD,
      }).firestore();
      await assertFails(updateDoc(doc(db, AUTH_PATH), { response: sampleResponse }));
    });
  });

  describe("update — bishopric ack path (ackOnceOk)", () => {
    it("active bishop writes acknowledgedAt", async () => {
      await seedSplit(env, {
        auth: {
          response: {
            answer: "yes",
            respondedAt: serverTimestamp(),
            actorUid: "speaker-uid",
          },
        },
      });
      const db = authedAs(env, "bishop", "b@x.com").firestore();
      await assertSucceeds(
        updateDoc(doc(db, AUTH_PATH), {
          "response.acknowledgedAt": serverTimestamp(),
          "response.acknowledgedBy": "bishop",
        }),
      );
    });

    it("blocks overwriting an existing acknowledgedAt with a different value", async () => {
      const ackedAt = Timestamp.fromDate(new Date("2026-04-21T10:00:00Z"));
      await seedSplit(env, {
        auth: {
          response: {
            answer: "yes",
            respondedAt: serverTimestamp(),
            actorUid: "speaker-uid",
            acknowledgedAt: ackedAt,
            acknowledgedBy: "bishop",
          },
        },
      });
      const db = authedAs(env, "bishop", "b@x.com").firestore();
      await assertFails(
        updateDoc(doc(db, AUTH_PATH), {
          "response.acknowledgedAt": Timestamp.fromDate(new Date("2026-04-22T10:00:00Z")),
        }),
      );
    });
  });

  describe("create / delete", () => {
    it("anonymous create blocked", async () => {
      const db = env.unauthenticatedContext().firestore();
      await assertFails(setDoc(doc(db, AUTH_PATH), sampleAuth));
    });

    it("active bishop create blocked (Admin SDK only)", async () => {
      const db = authedAs(env, "bishop", "b@x.com").firestore();
      await assertFails(setDoc(doc(db, AUTH_PATH), sampleAuth));
    });

    it("active bishop delete blocked (Admin SDK only)", async () => {
      await seedSplit(env);
      const db = authedAs(env, "bishop", "b@x.com").firestore();
      await assertFails(deleteDoc(doc(db, AUTH_PATH)));
    });
  });
});
