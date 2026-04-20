import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { authedAs, createTestEnv, seedMember, seedWard } from "./_helpers";

const tpl = {
  name: "Speaker Invitation",
  subject: "Speak on {{date}}",
  body: "Dear {{speakerName}}, ...",
};

describe("letterTemplates rules", () => {
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
    await seedMember(env, { wardId: "w1", uid: "bishop", email: "b@x.com", role: "bishopric" });
    await seedMember(env, { wardId: "w1", uid: "clerk", email: "c@x.com", role: "clerk" });
  });

  it("lets clerks read templates", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "wards/w1/letterTemplates/invite"), tpl);
    });
    const db = authedAs(env, "clerk", "c@x.com").firestore();
    await assertSucceeds(getDoc(doc(db, "wards/w1/letterTemplates/invite")));
  });

  it("lets bishopric create + update templates", async () => {
    const db = authedAs(env, "bishop", "b@x.com").firestore();
    await assertSucceeds(setDoc(doc(db, "wards/w1/letterTemplates/invite"), tpl));
    await assertSucceeds(
      setDoc(doc(db, "wards/w1/letterTemplates/invite"), { ...tpl, subject: "new" }),
    );
  });

  it("blocks clerks from writing templates", async () => {
    const db = authedAs(env, "clerk", "c@x.com").firestore();
    await assertFails(setDoc(doc(db, "wards/w1/letterTemplates/invite"), tpl));
  });
});
