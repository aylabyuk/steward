import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, serverTimestamp, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import { authedAs, createTestEnv, seedMember, seedWard } from "./_helpers";

const WARD = "w1";
const TOKEN = "ABC123abcDEF456";
const PATH = `wards/${WARD}/speakerInvitations/${TOKEN}`;

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
    it("lets an anonymous user read the invitation by token", async () => {
      await seedInvitation(env);
      const db = env.unauthenticatedContext().firestore();
      await assertSucceeds(
        import("firebase/firestore").then(({ getDoc }) => getDoc(doc(db, PATH))),
      );
    });

    it("lets a signed-in non-member read the invitation by token", async () => {
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

  describe("update — speaker self-response path", () => {
    const SPEAKER_EMAIL = "speaker@example.com";
    const FUTURE = Timestamp.fromDate(new Date("2099-12-31T00:00:00Z"));
    const PAST = Timestamp.fromDate(new Date("2000-01-01T00:00:00Z"));

    async function seedWithContext(opts: {
      speakerEmail?: string;
      expiresAt?: Timestamp;
      response?: Record<string, unknown>;
    }): Promise<void> {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), PATH), {
          ...sample,
          ...(opts.speakerEmail !== undefined ? { speakerEmail: opts.speakerEmail } : {}),
          ...(opts.expiresAt !== undefined ? { expiresAt: opts.expiresAt } : {}),
          ...(opts.response !== undefined ? { response: opts.response } : {}),
        });
      });
    }

    const sampleResponse = {
      answer: "yes" as const,
      respondedAt: serverTimestamp(),
      actorUid: "speaker-uid",
      actorEmail: SPEAKER_EMAIL,
    };

    it("lets a signed-in speaker with matching email write the response subtree", async () => {
      await seedWithContext({ speakerEmail: SPEAKER_EMAIL, expiresAt: FUTURE });
      const db = authedAs(env, "speaker-uid", SPEAKER_EMAIL).firestore();
      await assertSucceeds(updateDoc(doc(db, PATH), { response: sampleResponse }));
    });

    it("is case-insensitive on the email match", async () => {
      await seedWithContext({ speakerEmail: "Speaker@Example.COM", expiresAt: FUTURE });
      const db = authedAs(env, "speaker-uid", "speaker@example.com").firestore();
      await assertSucceeds(updateDoc(doc(db, PATH), { response: sampleResponse }));
    });

    it("blocks a signed-in user whose email does NOT match", async () => {
      await seedWithContext({ speakerEmail: SPEAKER_EMAIL, expiresAt: FUTURE });
      const db = authedAs(env, "stranger", "someone-else@example.com").firestore();
      await assertFails(updateDoc(doc(db, PATH), { response: sampleResponse }));
    });

    it("blocks an unauthenticated caller", async () => {
      await seedWithContext({ speakerEmail: SPEAKER_EMAIL, expiresAt: FUTURE });
      const db = env.unauthenticatedContext().firestore();
      await assertFails(updateDoc(doc(db, PATH), { response: sampleResponse }));
    });

    it("blocks writes after expiresAt has passed", async () => {
      await seedWithContext({ speakerEmail: SPEAKER_EMAIL, expiresAt: PAST });
      const db = authedAs(env, "speaker-uid", SPEAKER_EMAIL).firestore();
      await assertFails(updateDoc(doc(db, PATH), { response: sampleResponse }));
    });

    it("blocks when speakerEmail was never snapshotted", async () => {
      await seedWithContext({ expiresAt: FUTURE }); // no speakerEmail
      const db = authedAs(env, "someone", "someone@example.com").firestore();
      await assertFails(updateDoc(doc(db, PATH), { response: sampleResponse }));
    });

    it("blocks speaker-side edits to any field outside `response`", async () => {
      await seedWithContext({ speakerEmail: SPEAKER_EMAIL, expiresAt: FUTURE });
      const db = authedAs(env, "speaker-uid", SPEAKER_EMAIL).firestore();
      await assertFails(updateDoc(doc(db, PATH), { bodyMarkdown: "tampered letter body" }));
    });

    it("blocks speaker-side edits that touch response AND a forbidden field", async () => {
      await seedWithContext({ speakerEmail: SPEAKER_EMAIL, expiresAt: FUTURE });
      const db = authedAs(env, "speaker-uid", SPEAKER_EMAIL).firestore();
      await assertFails(
        updateDoc(doc(db, PATH), {
          response: sampleResponse,
          speakerName: "Fake Name",
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
  });
});
