import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
import { authedAs, createTestEnv, seedMember, seedWard } from "./_helpers";

const WARD = "w1";
const T_PATH = `wards/${WARD}/templates/speakerLetter`;

const sampleTemplate = {
  bodyMarkdown: "Dear {{speakerName}}, …",
  footerMarkdown: "And all things whatsoever ye shall ask in prayer…",
};

async function seedTemplate(env: RulesTestEnvironment) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), T_PATH), sampleTemplate);
  });
}

describe("letter template rules", () => {
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
    await seedMember(env, {
      wardId: WARD,
      uid: "inactive",
      email: "i@x.com",
      role: "clerk",
      active: false,
    });
  });

  it("lets an active bishopric member read + write the template", async () => {
    const db = authedAs(env, "bishop", "b@x.com").firestore();
    await assertSucceeds(setDoc(doc(db, T_PATH), sampleTemplate));
  });

  it("lets an active clerk read + write the template", async () => {
    const db = authedAs(env, "clerk", "c@x.com").firestore();
    await assertSucceeds(setDoc(doc(db, T_PATH), sampleTemplate));
  });

  it("blocks an inactive member from writing", async () => {
    const db = authedAs(env, "inactive", "i@x.com").firestore();
    await assertFails(setDoc(doc(db, T_PATH), sampleTemplate));
  });

  it("blocks a non-member from writing", async () => {
    const db = authedAs(env, "stranger", "s@x.com").firestore();
    await assertFails(setDoc(doc(db, T_PATH), sampleTemplate));
  });

  it("blocks a non-member from reading an existing template", async () => {
    await seedTemplate(env);
    const db = authedAs(env, "stranger", "s@x.com").firestore();
    await assertFails(import("firebase/firestore").then(({ getDoc }) => getDoc(doc(db, T_PATH))));
  });

  it("lets an active member delete the template", async () => {
    await seedTemplate(env);
    const db = authedAs(env, "clerk", "c@x.com").firestore();
    await assertSucceeds(deleteDoc(doc(db, T_PATH)));
  });

  // Same rule applies to every templateId under /templates/{templateId};
  // spot-check the ward-invite template path to guard against a future
  // split where someone narrows the wildcard.
  it("covers the wardInvite template under the same rule", async () => {
    const db = authedAs(env, "clerk", "c@x.com").firestore();
    await assertSucceeds(
      setDoc(doc(db, `wards/${WARD}/templates/wardInvite`), {
        bodyMarkdown: "Hi {{inviteeName}}, …",
      }),
    );
    const stranger = authedAs(env, "stranger", "s@x.com").firestore();
    await assertFails(
      setDoc(doc(stranger, `wards/${WARD}/templates/wardInvite`), {
        bodyMarkdown: "tampered",
      }),
    );
  });
});
