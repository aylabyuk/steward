import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, serverTimestamp, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import { authedAs, authedAsSpeaker, createTestEnv, seedMember, seedWard } from "./_helpers";

const WARD = "w1";
const INVITATION_ID = "ABC123abcDEF456";
const PATH = `wards/${WARD}/speakerInvitations/${INVITATION_ID}`;

const sample = {
  speakerRef: { meetingDate: "2026-04-26", speakerId: "s1" },
  assignedDate: "Sunday, April 26, 2026",
  sentOn: "April 21, 2026",
  wardName: "Eglinton Ward",
  speakerName: "Sebastian Tan",
  speakerTopic: "Repentance",
  inviterName: "Bishop Paul",
  bodyMarkdown: "Dear Sebastian Tan, …",
  footerMarkdown: "And all things whatsoever …",
};

async function seedInvitation(env: RulesTestEnvironment) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), PATH), sample);
  });
}

describe("speaker invitation rules", () => {
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

  describe("read (public)", () => {
    it("lets an anonymous user read the invitation by doc ID", async () => {
      await seedInvitation(env);
      const db = env.unauthenticatedContext().firestore();
      await assertSucceeds(
        import("firebase/firestore").then(({ getDoc }) => getDoc(doc(db, PATH))),
      );
    });

    it("lets a signed-in non-member read the invitation by doc ID", async () => {
      await seedInvitation(env);
      const db = authedAs(env, "stranger", "s@x.com").firestore();
      await assertSucceeds(
        import("firebase/firestore").then(({ getDoc }) => getDoc(doc(db, PATH))),
      );
    });
  });

  describe("write (bishopric / clerk only)", () => {
    it("lets an active bishopric member send an invitation", async () => {
      const db = authedAs(env, "bishop", "b@x.com").firestore();
      await assertSucceeds(setDoc(doc(db, PATH), sample));
    });

    it("lets an active clerk send an invitation", async () => {
      const db = authedAs(env, "clerk", "c@x.com").firestore();
      await assertSucceeds(setDoc(doc(db, PATH), sample));
    });

    it("blocks an anonymous user from creating an invitation", async () => {
      const db = env.unauthenticatedContext().firestore();
      await assertFails(setDoc(doc(db, PATH), sample));
    });

    it("blocks a signed-in non-member from creating an invitation", async () => {
      const db = authedAs(env, "stranger", "s@x.com").firestore();
      await assertFails(setDoc(doc(db, PATH), sample));
    });

    it("lets an active member delete their ward's invitation", async () => {
      await seedInvitation(env);
      const db = authedAs(env, "clerk", "c@x.com").firestore();
      await assertSucceeds(deleteDoc(doc(db, PATH)));
    });

    it("blocks an anonymous user from deleting the invitation", async () => {
      await seedInvitation(env);
      const db = env.unauthenticatedContext().firestore();
      await assertFails(deleteDoc(doc(db, PATH)));
    });
  });

  describe("update — speaker self-response path (claim-based)", () => {
    const FUTURE = Timestamp.fromDate(new Date("2099-12-31T00:00:00Z"));
    const PAST = Timestamp.fromDate(new Date("2000-01-01T00:00:00Z"));
    const SPEAKER_UID = `speaker:${WARD}:${INVITATION_ID}`;

    async function seedWithContext(opts: {
      expiresAt?: Timestamp;
      tokenExpiresAt?: Timestamp;
      response?: Record<string, unknown>;
    }): Promise<void> {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), PATH), {
          ...sample,
          ...(opts.expiresAt !== undefined ? { expiresAt: opts.expiresAt } : {}),
          ...(opts.tokenExpiresAt !== undefined ? { tokenExpiresAt: opts.tokenExpiresAt } : {}),
          ...(opts.response !== undefined ? { response: opts.response } : {}),
        });
      });
    }

    const sampleResponse = {
      answer: "yes" as const,
      respondedAt: serverTimestamp(),
      actorUid: SPEAKER_UID,
    };

    it("lets a speaker with matching invitationId + wardId claims write the response", async () => {
      await seedWithContext({ expiresAt: FUTURE });
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: INVITATION_ID,
        wardId: WARD,
      }).firestore();
      await assertSucceeds(updateDoc(doc(db, PATH), { response: sampleResponse }));
    });

    it("blocks a speaker whose invitationId claim points to a different doc", async () => {
      await seedWithContext({ expiresAt: FUTURE });
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: "other-invitation",
        wardId: WARD,
      }).firestore();
      await assertFails(updateDoc(doc(db, PATH), { response: sampleResponse }));
    });

    it("blocks a speaker whose wardId claim doesn't match the path", async () => {
      await seedWithContext({ expiresAt: FUTURE });
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: INVITATION_ID,
        wardId: "other-ward",
      }).firestore();
      await assertFails(updateDoc(doc(db, PATH), { response: sampleResponse }));
    });

    it("blocks a signed-in user with no speaker claims (bishopric email path only)", async () => {
      await seedWithContext({ expiresAt: FUTURE });
      const db = authedAs(env, "stranger", "s@x.com").firestore();
      await assertFails(updateDoc(doc(db, PATH), { response: sampleResponse }));
    });

    it("blocks an unauthenticated caller", async () => {
      await seedWithContext({ expiresAt: FUTURE });
      const db = env.unauthenticatedContext().firestore();
      await assertFails(updateDoc(doc(db, PATH), { response: sampleResponse }));
    });

    it("blocks writes after expiresAt has passed", async () => {
      await seedWithContext({ expiresAt: PAST });
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: INVITATION_ID,
        wardId: WARD,
      }).firestore();
      await assertFails(updateDoc(doc(db, PATH), { response: sampleResponse }));
    });

    it("blocks speaker-side edits to any field outside `response`", async () => {
      await seedWithContext({ expiresAt: FUTURE });
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: INVITATION_ID,
        wardId: WARD,
      }).firestore();
      await assertFails(updateDoc(doc(db, PATH), { bodyMarkdown: "tampered letter body" }));
    });

    it("blocks speaker-side edits that touch response AND a forbidden field", async () => {
      await seedWithContext({ expiresAt: FUTURE });
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: INVITATION_ID,
        wardId: WARD,
      }).firestore();
      await assertFails(
        updateDoc(doc(db, PATH), {
          response: sampleResponse,
          speakerName: "Fake Name",
        }),
      );
    });

    it("lets a speaker write the speakerLastSeenAt heartbeat", async () => {
      await seedWithContext({ expiresAt: FUTURE });
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: INVITATION_ID,
        wardId: WARD,
      }).firestore();
      await assertSucceeds(updateDoc(doc(db, PATH), { speakerLastSeenAt: serverTimestamp() }));
    });

    it("lets a speaker write response + speakerLastSeenAt together", async () => {
      await seedWithContext({ expiresAt: FUTURE });
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: INVITATION_ID,
        wardId: WARD,
      }).firestore();
      await assertSucceeds(
        updateDoc(doc(db, PATH), {
          response: sampleResponse,
          speakerLastSeenAt: serverTimestamp(),
        }),
      );
    });

    it("blocks speaker heartbeat past expiry", async () => {
      await seedWithContext({ expiresAt: PAST });
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: INVITATION_ID,
        wardId: WARD,
      }).firestore();
      await assertFails(updateDoc(doc(db, PATH), { speakerLastSeenAt: serverTimestamp() }));
    });

    it("blocks speaker writes past tokenExpiresAt even if expiresAt is future", async () => {
      await seedWithContext({ expiresAt: FUTURE, tokenExpiresAt: PAST });
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: INVITATION_ID,
        wardId: WARD,
      }).firestore();
      await assertFails(updateDoc(doc(db, PATH), { response: sampleResponse }));
    });

    it("allows speaker writes when tokenExpiresAt is set and in the future", async () => {
      await seedWithContext({ expiresAt: FUTURE, tokenExpiresAt: FUTURE });
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: INVITATION_ID,
        wardId: WARD,
      }).firestore();
      await assertSucceeds(updateDoc(doc(db, PATH), { response: sampleResponse }));
    });

    it("blocks speaker spoofing actorUid (different uid in response)", async () => {
      await seedWithContext({ expiresAt: FUTURE });
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: INVITATION_ID,
        wardId: WARD,
      }).firestore();
      await assertFails(
        updateDoc(doc(db, PATH), {
          response: { ...sampleResponse, actorUid: "bishop" },
        }),
      );
    });

    it("blocks capability-token speaker (no auth email) from claiming an actorEmail", async () => {
      await seedWithContext({ expiresAt: FUTURE });
      // authedAsSpeaker sets only invitationId+wardId+role claims; no email.
      const db = authedAsSpeaker(env, SPEAKER_UID, {
        invitationId: INVITATION_ID,
        wardId: WARD,
      }).firestore();
      await assertFails(
        updateDoc(doc(db, PATH), {
          response: { ...sampleResponse, actorEmail: "bishop@x.com" },
        }),
      );
    });

    it("blocks speaker writing actorEmail that doesn't match auth.token.email", async () => {
      await seedWithContext({ expiresAt: FUTURE });
      // Speaker session minted with verified email; tries to claim a different one.
      const db = env
        .authenticatedContext(SPEAKER_UID, {
          invitationId: INVITATION_ID,
          wardId: WARD,
          role: "speaker",
          email: "speaker@example.com",
          email_verified: true,
        })
        .firestore();
      await assertFails(
        updateDoc(doc(db, PATH), {
          response: { ...sampleResponse, actorEmail: "different@x.com" },
        }),
      );
    });

    it("allows google-signed-in speaker writing matching actorEmail", async () => {
      await seedWithContext({ expiresAt: FUTURE });
      const db = env
        .authenticatedContext(SPEAKER_UID, {
          invitationId: INVITATION_ID,
          wardId: WARD,
          role: "speaker",
          email: "speaker@example.com",
          email_verified: true,
        })
        .firestore();
      await assertSucceeds(
        updateDoc(doc(db, PATH), {
          response: { ...sampleResponse, actorEmail: "speaker@example.com" },
        }),
      );
    });
  });

  describe("update — bishopric acknowledgement path", () => {
    const SPEAKER_EMAIL = "speaker@example.com";
    const FUTURE = Timestamp.fromDate(new Date("2099-12-31T00:00:00Z"));

    it("lets an active bishop acknowledge a response (writes acknowledgedAt + status)", async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), PATH), {
          ...sample,
          speakerEmail: SPEAKER_EMAIL,
          expiresAt: FUTURE,
          response: {
            answer: "yes",
            respondedAt: serverTimestamp(),
            actorUid: "speaker-uid",
            actorEmail: SPEAKER_EMAIL,
          },
        });
      });
      const db = authedAs(env, "bishop", "b@x.com").firestore();
      await assertSucceeds(
        updateDoc(doc(db, PATH), {
          "response.acknowledgedAt": serverTimestamp(),
          "response.acknowledgedBy": "bishop",
        }),
      );
    });

    it("lets an active bishop edit any field (letter body, etc.) — full update path", async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), PATH), sample);
      });
      const db = authedAs(env, "clerk", "c@x.com").firestore();
      await assertSucceeds(updateDoc(doc(db, PATH), { bodyMarkdown: "edited letter body" }));
    });

    it("blocks overwriting an existing acknowledgedAt with a different value", async () => {
      const ackedAt = Timestamp.fromDate(new Date("2026-04-21T10:00:00Z"));
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), PATH), {
          ...sample,
          expiresAt: FUTURE,
          response: {
            answer: "yes",
            respondedAt: serverTimestamp(),
            actorUid: "speaker-uid",
            acknowledgedAt: ackedAt,
            acknowledgedBy: "bishop",
          },
        });
      });
      const db = authedAs(env, "clerk", "c@x.com").firestore();
      // Different timestamp than what's on the doc.
      await assertFails(
        updateDoc(doc(db, PATH), {
          "response.acknowledgedAt": Timestamp.fromDate(new Date("2026-04-22T10:00:00Z")),
        }),
      );
    });

    it("blocks clearing an existing acknowledgedAt", async () => {
      const ackedAt = Timestamp.fromDate(new Date("2026-04-21T10:00:00Z"));
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), PATH), {
          ...sample,
          expiresAt: FUTURE,
          response: {
            answer: "yes",
            respondedAt: serverTimestamp(),
            actorUid: "speaker-uid",
            acknowledgedAt: ackedAt,
            acknowledgedBy: "bishop",
          },
        });
      });
      const db = authedAs(env, "bishop", "b@x.com").firestore();
      await assertFails(updateDoc(doc(db, PATH), { "response.acknowledgedAt": null }));
    });

    it("allows a content edit that preserves acknowledgedAt unchanged", async () => {
      const ackedAt = Timestamp.fromDate(new Date("2026-04-21T10:00:00Z"));
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), PATH), {
          ...sample,
          expiresAt: FUTURE,
          response: {
            answer: "yes",
            respondedAt: serverTimestamp(),
            actorUid: "speaker-uid",
            acknowledgedAt: ackedAt,
            acknowledgedBy: "bishop",
          },
        });
      });
      const db = authedAs(env, "bishop", "b@x.com").firestore();
      // Editing a peer field — acknowledgedAt stays untouched.
      await assertSucceeds(updateDoc(doc(db, PATH), { bodyMarkdown: "tweaked" }));
    });
  });
});
