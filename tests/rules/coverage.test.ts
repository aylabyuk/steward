// Belt-and-suspenders coverage of paths that aren't a feature in their own
// right but still need explicit deny-by-default tests.

import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { addDoc, collection, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { authedAs, createTestEnv, seedMember, seedWard } from "./_helpers";

describe("rules catch-all + edge cases", () => {
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
    await seedMember(env, { wardId: "w1", uid: "bish", email: "b@x.com", role: "bishopric" });
    await seedMember(env, { wardId: "w1", uid: "clerk", email: "c@x.com", role: "clerk" });
    await seedMember(env, {
      wardId: "w1",
      uid: "inactive",
      email: "i@x.com",
      role: "clerk",
      active: false,
    });
  });

  it("forbids in-app ward creation (bootstrap is admin-SDK only)", async () => {
    const db = authedAs(env, "bish", "b@x.com").firestore();
    await assertFails(setDoc(doc(db, "wards/new-ward"), { name: "Nope" }));
  });

  it("forbids ward deletion even by bishopric", async () => {
    const db = authedAs(env, "bish", "b@x.com").firestore();
    await assertFails(deleteDoc(doc(db, "wards/w1")));
  });

  it("blocks an inactive member from updating ward settings", async () => {
    const db = authedAs(env, "inactive", "i@x.com").firestore();
    await assertFails(setDoc(doc(db, "wards/w1"), { name: "Hacked" }, { merge: true }));
  });

  it("denies client read on the notificationQueue collection", async () => {
    // Functions seed this with the Admin SDK; clients have no business reading it.
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc("wards/w1/notificationQueue/2026-04-26").set({ description: "x" });
    });
    const db = authedAs(env, "bish", "b@x.com").firestore();
    await assertFails(getDoc(doc(db, "wards/w1/notificationQueue/2026-04-26")));
    await assertFails(addDoc(collection(db, "wards/w1/notificationQueue"), { description: "y" }));
  });

  it("denies client writes to unknown subcollections under a ward", async () => {
    const db = authedAs(env, "bish", "b@x.com").firestore();
    await assertFails(addDoc(collection(db, "wards/w1/randomThing"), { ok: true }));
  });

  it("blocks cross-ward letter template reads", async () => {
    await seedWard(env, "w2");
    await seedMember(env, { wardId: "w2", uid: "bob", email: "bob@x.com", role: "clerk" });
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx
        .firestore()
        .doc("wards/w1/letterTemplates/invite")
        .set({ name: "Invite", subject: "S", body: "B" });
    });
    const db = authedAs(env, "bob", "bob@x.com").firestore();
    await assertFails(getDoc(doc(db, "wards/w1/letterTemplates/invite")));
  });

  it("smoke: bishopric can still read their own ward", async () => {
    const db = authedAs(env, "bish", "b@x.com").firestore();
    await assertSucceeds(getDoc(doc(db, "wards/w1")));
  });
});
