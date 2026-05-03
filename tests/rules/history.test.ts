import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { addDoc, collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { authedAs, createTestEnv, seedMember, seedWard } from "./_helpers";

const DATE = "2026-04-26";
const HISTORY = `wards/w1/meetings/${DATE}/history`;
const MEETING = `wards/w1/meetings/${DATE}`;

const baseMeeting = {
  meetingType: "regular",
  wardBusiness: "",
  stakeBusiness: "",
  announcements: "",
  contentVersionHash: "abc",
};

function event(overrides: Record<string, unknown> = {}) {
  return {
    actorUid: "alice",
    actorDisplayName: "Alice",
    at: new Date(),
    target: "meeting",
    targetId: DATE,
    action: "update",
    changes: [{ field: "wardBusiness", new: "x" }],
    ...overrides,
  };
}

describe("history rules", () => {
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
    await seedMember(env, { wardId: "w1", uid: "bob", email: "b@x.com", role: "clerk" });
    await seedMember(env, {
      wardId: "w1",
      uid: "inactive",
      email: "i@x.com",
      role: "clerk",
      active: false,
    });
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(MEETING).set(baseMeeting);
    });
  });

  it("lets an active member append a history event for themselves", async () => {
    const db = authedAs(env, "alice", "a@x.com").firestore();
    await assertSucceeds(addDoc(collection(db, HISTORY), event()));
  });

  it("blocks an event attributed to another user", async () => {
    const db = authedAs(env, "alice", "a@x.com").firestore();
    await assertFails(addDoc(collection(db, HISTORY), event({ actorUid: "bob" })));
  });

  it("blocks an inactive member from appending history", async () => {
    const db = authedAs(env, "inactive", "i@x.com").firestore();
    await assertFails(addDoc(collection(db, HISTORY), event({ actorUid: "inactive" })));
  });

  it("blocks events with an unknown target", async () => {
    const db = authedAs(env, "alice", "a@x.com").firestore();
    await assertFails(addDoc(collection(db, HISTORY), event({ target: "settings" })));
  });

  it("forbids updating a history event after creation", async () => {
    const id = "h1";
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`${HISTORY}/${id}`).set(event());
    });
    const db = authedAs(env, "alice", "a@x.com").firestore();
    await assertFails(updateDoc(doc(db, `${HISTORY}/${id}`), { action: "create" }));
  });

  it("forbids deleting a history event", async () => {
    const id = "h2";
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`${HISTORY}/${id}`).set(event());
    });
    const db = authedAs(env, "alice", "a@x.com").firestore();
    await assertFails(deleteDoc(doc(db, `${HISTORY}/${id}`)));
  });
});
