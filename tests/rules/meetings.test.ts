import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { addDoc, collection, doc, getDoc, setDoc } from "firebase/firestore";
import { authedAs, createTestEnv, seedMember, seedWard } from "./_helpers";

const DATE = "2026-04-26";

const draftMeeting = {
  meetingType: "regular" as const,
  status: "draft" as const,
  approvals: [],
  wardBusiness: "",
  stakeBusiness: "",
  announcements: "",
};

const speaker = {
  name: "Alice",
  status: "not_assigned" as const,
};

describe("meetings + speakers rules", () => {
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
  });

  it("lets an active member create a meeting doc", async () => {
    const db = authedAs(env, "alice", "a@x.com").firestore();
    await assertSucceeds(setDoc(doc(db, `wards/w1/meetings/${DATE}`), draftMeeting));
  });

  it("lets an active member read, update, and add speakers", async () => {
    const db = authedAs(env, "alice", "a@x.com").firestore();
    await setDoc(doc(db, `wards/w1/meetings/${DATE}`), draftMeeting);
    await assertSucceeds(getDoc(doc(db, `wards/w1/meetings/${DATE}`)));
    await assertSucceeds(
      setDoc(doc(db, `wards/w1/meetings/${DATE}`), {
        ...draftMeeting,
        wardBusiness: "updated",
      }),
    );
    await assertSucceeds(addDoc(collection(db, `wards/w1/meetings/${DATE}/speakers`), speaker));
  });

  it("rejects meeting writes from an inactive member", async () => {
    const db = authedAs(env, "inactive", "i@x.com").firestore();
    await assertFails(setDoc(doc(db, `wards/w1/meetings/${DATE}`), draftMeeting));
  });

  it("rejects meeting writes from a non-member (cross-ward)", async () => {
    await seedWard(env, "w2");
    await seedMember(env, { wardId: "w2", uid: "bob", email: "b@x.com", role: "clerk" });
    const db = authedAs(env, "bob", "b@x.com").firestore();
    await assertFails(setDoc(doc(db, `wards/w1/meetings/${DATE}`), draftMeeting));
  });

  it("rejects meeting reads + speaker writes by an unauthenticated user", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, `wards/w1/meetings/${DATE}`)));
    await assertFails(addDoc(collection(db, `wards/w1/meetings/${DATE}/speakers`), speaker));
  });
});
