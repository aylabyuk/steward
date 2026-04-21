import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
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
});
