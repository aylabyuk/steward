import { afterAll, beforeAll, describe, it } from "vitest";
import { assertFails, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc } from "firebase/firestore";
import { createTestEnv } from "./_helpers";

describe("firestore rules baseline", () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await createTestEnv();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it("denies unauthenticated reads under the deny-all baseline", async () => {
    const unauth = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(unauth, "any/doc")));
  });
});
