import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, updateDoc } from "firebase/firestore";
import { authedAs, createTestEnv, seedMember, seedWard } from "./_helpers";

const WARD = "wards/w1";

const baseSettings = {
  timezone: "UTC",
  speakerLeadTimeDays: 14,
  scheduleHorizonWeeks: 8,
  nonMeetingSundays: [],
  nudgeSchedule: {
    wednesday: { enabled: true, hour: 19 },
    friday: { enabled: true, hour: 19 },
    saturday: { enabled: false, hour: 9 },
  },
  emailCcDefaults: {},
};

describe("ward settings rules", () => {
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
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(WARD).set({ name: "Test Ward", settings: baseSettings });
    });
  });

  it("lets a bishopric member update settings", async () => {
    const db = authedAs(env, "bish", "b@x.com").firestore();
    await assertSucceeds(
      updateDoc(doc(db, WARD), {
        settings: { ...baseSettings, scheduleHorizonWeeks: 12 },
      }),
    );
  });

  it("blocks a clerk from updating settings", async () => {
    const db = authedAs(env, "clerk", "c@x.com").firestore();
    await assertFails(
      updateDoc(doc(db, WARD), {
        settings: { ...baseSettings, scheduleHorizonWeeks: 12 },
      }),
    );
  });

  it("blocks an unauthenticated update", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(updateDoc(doc(db, WARD), { name: "Hacked" }));
  });
});
