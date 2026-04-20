import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { addDoc, collection, deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { authedAs, createTestEnv, seedMember, seedWard } from "./_helpers";

const DATE = "2026-04-26";
const SPEAKERS = `wards/w1/meetings/${DATE}/speakers`;

const speaker = { name: "Alice", status: "not_assigned" as const };

describe("speakers rules", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await createTestEnv();
  });

  afterAll(async () => {
    await env.cleanup();
  });

  beforeEach(async () => {
    await env.clearFirestore();
    await seedWard(env, "w1");
    await seedMember(env, { wardId: "w1", uid: "alice", email: "a@x.com", role: "clerk" });
    await seedMember(env, {
      wardId: "w1",
      uid: "inactive",
      email: "i@x.com",
      role: "clerk",
      active: false,
    });
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx
        .firestore()
        .doc(`${SPEAKERS}/s1`)
        .set({ ...speaker, name: "Existing" });
    });
  });

  it("lets an active member read, update, and delete speakers", async () => {
    const db = authedAs(env, "alice", "a@x.com").firestore();
    await assertSucceeds(getDoc(doc(db, `${SPEAKERS}/s1`)));
    await assertSucceeds(updateDoc(doc(db, `${SPEAKERS}/s1`), { topic: "Faith" }));
    await assertSucceeds(deleteDoc(doc(db, `${SPEAKERS}/s1`)));
  });

  it("blocks an inactive member from speaker writes", async () => {
    const db = authedAs(env, "inactive", "i@x.com").firestore();
    await assertFails(addDoc(collection(db, SPEAKERS), speaker));
    await assertFails(updateDoc(doc(db, `${SPEAKERS}/s1`), { topic: "x" }));
    await assertFails(deleteDoc(doc(db, `${SPEAKERS}/s1`)));
  });

  it("blocks cross-ward speaker access", async () => {
    await seedWard(env, "w2");
    await seedMember(env, { wardId: "w2", uid: "bob", email: "b@x.com", role: "clerk" });
    const db = authedAs(env, "bob", "b@x.com").firestore();
    await assertFails(getDoc(doc(db, `${SPEAKERS}/s1`)));
    await assertFails(addDoc(collection(db, SPEAKERS), speaker));
  });

  it("blocks unauthenticated speaker access", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, `${SPEAKERS}/s1`)));
    await assertFails(addDoc(collection(db, SPEAKERS), speaker));
  });
});
