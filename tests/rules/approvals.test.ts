import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";
import { authedAs, createTestEnv, seedMember, seedWard } from "./_helpers";

const DATE = "2026-04-26";
const M_PATH = `wards/w1/meetings/${DATE}`;

const draft = {
  meetingType: "regular",
  status: "draft",
  approvals: [],
  wardBusiness: "",
  stakeBusiness: "",
  announcements: "",
  contentVersionHash: "abc",
};

async function seedMeeting(env: RulesTestEnvironment, data: Record<string, unknown>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), M_PATH), data);
  });
}

const approvalOf = (uid: string, email: string) => ({
  uid,
  email,
  displayName: uid,
  approvedAt: null,
  approvedVersionHash: "abc",
  invalidated: false,
});

describe("meeting approval rules", () => {
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
    await seedMember(env, { wardId: "w1", uid: "bishop1", email: "b1@x.com", role: "bishopric" });
    await seedMember(env, { wardId: "w1", uid: "bishop2", email: "b2@x.com", role: "bishopric" });
    await seedMember(env, { wardId: "w1", uid: "clerk", email: "c@x.com", role: "clerk" });
  });

  it("lets a clerk edit content (status stays draft, approvals unchanged)", async () => {
    await seedMeeting(env, draft);
    const db = authedAs(env, "clerk", "c@x.com").firestore();
    await assertSucceeds(setDoc(doc(db, M_PATH), { ...draft, wardBusiness: "updated" }));
  });

  it("blocks a clerk from flipping status to pending_approval", async () => {
    await seedMeeting(env, draft);
    const db = authedAs(env, "clerk", "c@x.com").firestore();
    await assertFails(setDoc(doc(db, M_PATH), { ...draft, status: "pending_approval" }));
  });

  it("lets bishopric flip status to pending_approval", async () => {
    await seedMeeting(env, draft);
    const db = authedAs(env, "bishop1", "b1@x.com").firestore();
    await assertSucceeds(setDoc(doc(db, M_PATH), { ...draft, status: "pending_approval" }));
  });

  it("blocks a clerk from appending an approval", async () => {
    await seedMeeting(env, { ...draft, status: "pending_approval" });
    const db = authedAs(env, "clerk", "c@x.com").firestore();
    await assertFails(
      setDoc(doc(db, M_PATH), {
        ...draft,
        status: "pending_approval",
        approvals: [approvalOf("clerk", "c@x.com")],
      }),
    );
  });

  it("lets bishopric append their own approval", async () => {
    await seedMeeting(env, { ...draft, status: "pending_approval" });
    const db = authedAs(env, "bishop1", "b1@x.com").firestore();
    await assertSucceeds(
      setDoc(doc(db, M_PATH), {
        ...draft,
        status: "pending_approval",
        approvals: [approvalOf("bishop1", "b1@x.com")],
      }),
    );
  });

  it("blocks bishopric from appending an approval attributed to someone else", async () => {
    await seedMeeting(env, { ...draft, status: "pending_approval" });
    const db = authedAs(env, "bishop1", "b1@x.com").firestore();
    await assertFails(
      setDoc(doc(db, M_PATH), {
        ...draft,
        status: "pending_approval",
        approvals: [approvalOf("bishop2", "b2@x.com")],
      }),
    );
  });

  it("blocks an inactive bishopric member from approving", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "wards/w1/members/inactive"), {
        email: "i@x.com",
        displayName: "Inactive",
        role: "bishopric",
        calling: "bishop",
        active: false,
      });
    });
    await seedMeeting(env, { ...draft, status: "pending_approval" });
    const db = authedAs(env, "inactive", "i@x.com").firestore();
    await assertFails(
      setDoc(doc(db, M_PATH), {
        ...draft,
        status: "pending_approval",
        approvals: [approvalOf("inactive", "i@x.com")],
      }),
    );
  });

  it("blocks shrinking the approvals array", async () => {
    await seedMeeting(env, {
      ...draft,
      status: "approved",
      approvals: [approvalOf("bishop1", "b1@x.com"), approvalOf("bishop2", "b2@x.com")],
    });
    const db = authedAs(env, "bishop1", "b1@x.com").firestore();
    await assertFails(
      setDoc(doc(db, M_PATH), {
        ...draft,
        status: "approved",
        approvals: [approvalOf("bishop1", "b1@x.com")],
      }),
    );
  });

  it("lets any active member flip status back to draft (edit-invalidation path)", async () => {
    await seedMeeting(env, {
      ...draft,
      status: "approved",
      approvals: [approvalOf("bishop1", "b1@x.com"), approvalOf("bishop2", "b2@x.com")],
    });
    const db = authedAs(env, "clerk", "c@x.com").firestore();
    const invalidated = [
      { ...approvalOf("bishop1", "b1@x.com"), invalidated: true },
      { ...approvalOf("bishop2", "b2@x.com"), invalidated: true },
    ];
    await assertSucceeds(
      setDoc(doc(db, M_PATH), {
        ...draft,
        status: "draft",
        approvals: invalidated,
        contentVersionHash: "newhash",
      }),
    );
  });

  it("blocks a clerk from rewriting an existing approval under their own uid", async () => {
    await seedMeeting(env, {
      ...draft,
      status: "approved",
      approvals: [approvalOf("bishop1", "b1@x.com"), approvalOf("bishop2", "b2@x.com")],
    });
    const db = authedAs(env, "clerk", "c@x.com").firestore();
    // Same length, same status, but swaps bishop1 → clerk (a forged approval).
    await assertFails(
      setDoc(doc(db, M_PATH), {
        ...draft,
        status: "approved",
        approvals: [approvalOf("clerk", "c@x.com"), approvalOf("bishop2", "b2@x.com")],
      }),
    );
  });

  it("blocks rewriting an approval's displayName while preserving uid", async () => {
    await seedMeeting(env, {
      ...draft,
      status: "approved",
      approvals: [approvalOf("bishop1", "b1@x.com")],
    });
    const db = authedAs(env, "clerk", "c@x.com").firestore();
    const tampered = { ...approvalOf("bishop1", "b1@x.com"), displayName: "Bishop X" };
    await assertFails(
      setDoc(doc(db, M_PATH), {
        ...draft,
        status: "approved",
        approvals: [tampered],
      }),
    );
  });

  it("blocks rewriting approvedVersionHash on an existing approval", async () => {
    await seedMeeting(env, {
      ...draft,
      status: "approved",
      approvals: [approvalOf("bishop1", "b1@x.com")],
    });
    const db = authedAs(env, "clerk", "c@x.com").firestore();
    const tampered = { ...approvalOf("bishop1", "b1@x.com"), approvedVersionHash: "forged" };
    await assertFails(
      setDoc(doc(db, M_PATH), { ...draft, status: "approved", approvals: [tampered] }),
    );
  });

  it("blocks un-invalidating an invalidated approval", async () => {
    await seedMeeting(env, {
      ...draft,
      status: "draft",
      approvals: [{ ...approvalOf("bishop1", "b1@x.com"), invalidated: true }],
    });
    const db = authedAs(env, "bishop1", "b1@x.com").firestore();
    await assertFails(
      setDoc(doc(db, M_PATH), {
        ...draft,
        status: "approved",
        approvals: [approvalOf("bishop1", "b1@x.com")], // invalidated: false
      }),
    );
  });

  it("still allows invalidating an existing approval (edit path)", async () => {
    await seedMeeting(env, {
      ...draft,
      status: "approved",
      approvals: [approvalOf("bishop1", "b1@x.com")],
    });
    const db = authedAs(env, "clerk", "c@x.com").firestore();
    await assertSucceeds(
      setDoc(doc(db, M_PATH), {
        ...draft,
        status: "draft",
        approvals: [{ ...approvalOf("bishop1", "b1@x.com"), invalidated: true }],
        contentVersionHash: "newhash",
      }),
    );
  });

  it("blocks appending while also tampering with the prior entry", async () => {
    await seedMeeting(env, {
      ...draft,
      status: "pending_approval",
      approvals: [approvalOf("bishop1", "b1@x.com")],
    });
    const db = authedAs(env, "bishop2", "b2@x.com").firestore();
    const tamperedFirst = { ...approvalOf("bishop1", "b1@x.com"), approvedVersionHash: "forged" };
    await assertFails(
      setDoc(doc(db, M_PATH), {
        ...draft,
        status: "approved",
        approvals: [tamperedFirst, approvalOf("bishop2", "b2@x.com")],
      }),
    );
  });
});
