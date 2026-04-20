import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { collectionGroup, doc, getDoc, query, setDoc, where, getDocs } from "firebase/firestore";
import { authedAs, createTestEnv, seedMember, seedWard } from "./_helpers";

describe("wards/{wardId}/members rules", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await createTestEnv();
  });

  afterAll(async () => {
    await env.cleanup();
  });

  beforeEach(async () => {
    await env.clearFirestore();
  });

  it("rejects unauthenticated reads", async () => {
    await seedWard(env, "w1");
    await seedMember(env, { wardId: "w1", uid: "u1", email: "a@x.com", role: "bishopric" });
    const unauth = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(unauth, "wards/w1/members/u1")));
  });

  it("lets an active member read their own ward's member list", async () => {
    await seedWard(env, "w1");
    await seedMember(env, { wardId: "w1", uid: "alice", email: "a@x.com", role: "clerk" });
    const db = authedAs(env, "alice", "a@x.com").firestore();
    await assertSucceeds(getDoc(doc(db, "wards/w1/members/alice")));
  });

  it("blocks cross-ward reads (ward-A member cannot read ward-B members)", async () => {
    await seedWard(env, "wA");
    await seedWard(env, "wB");
    await seedMember(env, { wardId: "wA", uid: "alice", email: "a@x.com", role: "bishopric" });
    await seedMember(env, { wardId: "wB", uid: "bob", email: "b@x.com", role: "bishopric" });
    const db = authedAs(env, "alice", "a@x.com").firestore();
    await assertFails(getDoc(doc(db, "wards/wB/members/bob")));
  });

  it("blocks inactive members from reading their ward doc", async () => {
    await seedWard(env, "w1");
    await seedMember(env, {
      wardId: "w1",
      uid: "alice",
      email: "a@x.com",
      role: "bishopric",
      active: false,
    });
    const db = authedAs(env, "alice", "a@x.com").firestore();
    await assertFails(getDoc(doc(db, "wards/w1")));
  });

  it("allows cross-ward reads when the doc email matches the auth email", async () => {
    await seedWard(env, "wA");
    await seedWard(env, "wB");
    await seedMember(env, { wardId: "wA", uid: "multi", email: "me@x.com", role: "bishopric" });
    await seedMember(env, { wardId: "wB", uid: "multi2", email: "me@x.com", role: "clerk" });
    const db = authedAs(env, "me", "me@x.com").firestore();
    const snap = await getDocs(
      query(
        collectionGroup(db, "members"),
        where("email", "==", "me@x.com"),
        where("active", "==", true),
      ),
    );
    expect(snap.size).toBe(2);
  });

  it("refuses cross-ward collection-group reads for a non-matching email", async () => {
    await seedWard(env, "wA");
    await seedMember(env, { wardId: "wA", uid: "alice", email: "a@x.com", role: "bishopric" });
    const db = authedAs(env, "eve", "eve@x.com").firestore();
    await assertFails(
      getDocs(
        query(
          collectionGroup(db, "members"),
          where("email", "==", "a@x.com"),
          where("active", "==", true),
        ),
      ),
    );
  });

  it("blocks clerks from writing member docs", async () => {
    await seedWard(env, "w1");
    await seedMember(env, { wardId: "w1", uid: "clerk", email: "c@x.com", role: "clerk" });
    const db = authedAs(env, "clerk", "c@x.com").firestore();
    await assertFails(
      setDoc(doc(db, "wards/w1/members/new"), {
        email: "new@x.com",
        displayName: "New",
        role: "clerk",
        calling: "ward_clerk",
        active: true,
      }),
    );
  });

  it("lets bishopric create additional members", async () => {
    await seedWard(env, "w1");
    await seedMember(env, { wardId: "w1", uid: "bishop", email: "b@x.com", role: "bishopric" });
    const db = authedAs(env, "bishop", "b@x.com").firestore();
    await assertSucceeds(
      setDoc(doc(db, "wards/w1/members/new"), {
        email: "new@x.com",
        displayName: "New",
        role: "clerk",
        calling: "ward_clerk",
        active: true,
      }),
    );
  });

  it("enforces the first-member invariant (ward with no bishopric rejects in-app create)", async () => {
    await seedWard(env, "empty");
    const db = authedAs(env, "anyone", "anyone@x.com").firestore();
    await assertFails(
      setDoc(doc(db, "wards/empty/members/anyone"), {
        email: "anyone@x.com",
        displayName: "Anyone",
        role: "bishopric",
        calling: "bishop",
        active: true,
      }),
    );
  });
});
