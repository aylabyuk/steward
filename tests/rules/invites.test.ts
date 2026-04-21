import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
import { authedAs, createTestEnv, seedMember, seedWard } from "./_helpers";

const WARD = "w1";

const invitedEmail = "new@x.com";
const invite = {
  email: invitedEmail,
  displayName: "New Person",
  role: "clerk",
  calling: "ward_clerk",
  wardName: "w1 Ward",
  invitedBy: "bishop1",
  invitedByName: "Bishop 1",
  invitedAt: null,
};

async function seedInvite(env: RulesTestEnvironment, data: Record<string, unknown>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), `wards/${WARD}/invites/${invitedEmail}`), data);
  });
}

describe("invite rules", () => {
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
    await seedMember(env, {
      wardId: WARD,
      uid: "bishop1",
      email: "b1@x.com",
      role: "bishopric",
    });
    await seedMember(env, { wardId: WARD, uid: "clerk1", email: "c1@x.com", role: "clerk" });
  });

  describe("CRUD", () => {
    it("lets bishopric create an invite", async () => {
      const db = authedAs(env, "bishop1", "b1@x.com").firestore();
      await assertSucceeds(
        setDoc(doc(db, `wards/${WARD}/invites/${invitedEmail}`), invite),
      );
    });

    it("blocks a non-bishopric member from creating invites", async () => {
      const db = authedAs(env, "clerk1", "c1@x.com").firestore();
      await assertFails(
        setDoc(doc(db, `wards/${WARD}/invites/${invitedEmail}`), invite),
      );
    });

    it("lets bishopric revoke (delete) an invite", async () => {
      await seedInvite(env, invite);
      const db = authedAs(env, "bishop1", "b1@x.com").firestore();
      await assertSucceeds(deleteDoc(doc(db, `wards/${WARD}/invites/${invitedEmail}`)));
    });

    it("lets the invitee read their own invite (for the accept page)", async () => {
      await seedInvite(env, invite);
      // Invitee isn't a member yet; they authenticate with matching email.
      const db = authedAs(env, "newuser", invitedEmail).firestore();
      // Read via get() is all the accept-invite page does.
      await assertSucceeds(
        import("firebase/firestore").then(({ getDoc }) =>
          getDoc(doc(db, `wards/${WARD}/invites/${invitedEmail}`)),
        ),
      );
    });

    it("blocks a non-invitee signed-in user from reading someone else's invite", async () => {
      await seedInvite(env, invite);
      const db = authedAs(env, "stranger", "stranger@x.com").firestore();
      await assertFails(
        import("firebase/firestore").then(({ getDoc }) =>
          getDoc(doc(db, `wards/${WARD}/invites/${invitedEmail}`)),
        ),
      );
    });
  });

  describe("accept", () => {
    it("lets the invitee self-create a member doc matching the invite", async () => {
      await seedInvite(env, invite);
      const db = authedAs(env, "newuid", invitedEmail).firestore();
      await assertSucceeds(
        setDoc(doc(db, `wards/${WARD}/members/newuid`), {
          email: invitedEmail,
          displayName: invite.displayName,
          calling: invite.calling,
          role: invite.role,
          active: true,
        }),
      );
    });

    it("blocks accepting under a different uid (must use their own)", async () => {
      await seedInvite(env, invite);
      const db = authedAs(env, "newuid", invitedEmail).firestore();
      await assertFails(
        setDoc(doc(db, `wards/${WARD}/members/someoneelse`), {
          email: invitedEmail,
          displayName: invite.displayName,
          calling: invite.calling,
          role: invite.role,
          active: true,
        }),
      );
    });

    it("blocks accepting with an escalated role", async () => {
      await seedInvite(env, invite); // invite is for clerk / ward_clerk
      const db = authedAs(env, "newuid", invitedEmail).firestore();
      await assertFails(
        setDoc(doc(db, `wards/${WARD}/members/newuid`), {
          email: invitedEmail,
          displayName: invite.displayName,
          calling: "bishop",
          role: "bishopric",
          active: true,
        }),
      );
    });

    it("blocks accepting with a different displayName", async () => {
      await seedInvite(env, invite);
      const db = authedAs(env, "newuid", invitedEmail).firestore();
      await assertFails(
        setDoc(doc(db, `wards/${WARD}/members/newuid`), {
          email: invitedEmail,
          displayName: "Mallory",
          calling: invite.calling,
          role: invite.role,
          active: true,
        }),
      );
    });

    it("blocks self-creating a member with no matching invite", async () => {
      const db = authedAs(env, "newuid", "uninvited@x.com").firestore();
      await assertFails(
        setDoc(doc(db, `wards/${WARD}/members/newuid`), {
          email: "uninvited@x.com",
          displayName: "Nobody",
          calling: "ward_clerk",
          role: "clerk",
          active: true,
        }),
      );
    });

    it("lets the invitee delete their invite after accepting", async () => {
      await seedInvite(env, invite);
      const db = authedAs(env, "newuid", invitedEmail).firestore();
      await assertSucceeds(deleteDoc(doc(db, `wards/${WARD}/invites/${invitedEmail}`)));
    });
  });
});
