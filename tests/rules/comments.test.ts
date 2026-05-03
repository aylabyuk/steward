import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { authedAs, createTestEnv, seedMember, seedWard } from "./_helpers";

const DATE = "2026-04-26";
const COMMENTS = `wards/w1/meetings/${DATE}/comments`;
const MEETING = `wards/w1/meetings/${DATE}`;

const baseMeeting = {
  meetingType: "regular",
  wardBusiness: "",
  stakeBusiness: "",
  announcements: "",
  contentVersionHash: "abc",
};

describe("comments rules", () => {
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

  it("lets an active member create their own comment", async () => {
    const db = authedAs(env, "alice", "a@x.com").firestore();
    await assertSucceeds(
      addDoc(collection(db, COMMENTS), {
        authorUid: "alice",
        authorDisplayName: "Alice",
        body: "hello",
        mentionedUids: [],
        createdAt: new Date(),
      }),
    );
  });

  it("blocks posting a comment attributed to someone else", async () => {
    const db = authedAs(env, "alice", "a@x.com").firestore();
    await assertFails(
      addDoc(collection(db, COMMENTS), {
        authorUid: "bob",
        authorDisplayName: "Bob",
        body: "hi",
        mentionedUids: [],
        createdAt: new Date(),
      }),
    );
  });

  it("blocks an inactive member from commenting", async () => {
    const db = authedAs(env, "inactive", "i@x.com").firestore();
    await assertFails(
      addDoc(collection(db, COMMENTS), {
        authorUid: "inactive",
        authorDisplayName: "I",
        body: "x",
        mentionedUids: [],
        createdAt: new Date(),
      }),
    );
  });

  it("lets an author edit their own comment", async () => {
    const id = "c1";
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`${COMMENTS}/${id}`).set({
        authorUid: "alice",
        authorDisplayName: "Alice",
        body: "orig",
        mentionedUids: [],
        createdAt: new Date(),
      });
    });
    const db = authedAs(env, "alice", "a@x.com").firestore();
    await assertSucceeds(
      updateDoc(doc(db, `${COMMENTS}/${id}`), { body: "updated", editedAt: new Date() }),
    );
  });

  it("blocks a non-author from editing someone else's comment", async () => {
    const id = "c2";
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`${COMMENTS}/${id}`).set({
        authorUid: "bob",
        authorDisplayName: "Bob",
        body: "mine",
        mentionedUids: [],
        createdAt: new Date(),
      });
    });
    const db = authedAs(env, "alice", "a@x.com").firestore();
    await assertFails(updateDoc(doc(db, `${COMMENTS}/${id}`), { body: "hacked" }));
  });

  it("lets an author soft-delete their own comment", async () => {
    const id = "c3";
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`${COMMENTS}/${id}`).set({
        authorUid: "alice",
        authorDisplayName: "Alice",
        body: "gone",
        mentionedUids: [],
        createdAt: new Date(),
      });
    });
    const db = authedAs(env, "alice", "a@x.com").firestore();
    await assertSucceeds(updateDoc(doc(db, `${COMMENTS}/${id}`), { deletedAt: new Date() }));
  });
});
