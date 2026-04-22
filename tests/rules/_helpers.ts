import {
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PROJECT_ID = "steward-rules-test";
const EMULATOR_HOST = "127.0.0.1";
const EMULATOR_PORT = 8080;

export async function createTestEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: EMULATOR_HOST,
      port: EMULATOR_PORT,
      rules: readFileSync(resolve("firestore.rules"), "utf8"),
    },
  });
}

export interface SeedMember {
  wardId: string;
  uid: string;
  email: string;
  role: "bishopric" | "clerk";
  calling?: string;
  active?: boolean;
}

export async function seedMember(env: RulesTestEnvironment, m: SeedMember): Promise<void> {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, `wards/${m.wardId}/members/${m.uid}`), {
      email: m.email,
      displayName: m.uid,
      role: m.role,
      calling: m.calling ?? (m.role === "bishopric" ? "bishop" : "ward_clerk"),
      active: m.active ?? true,
    });
  });
}

export async function seedWard(env: RulesTestEnvironment, wardId: string): Promise<void> {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), `wards/${wardId}`), { name: wardId });
  });
}

export function authedAs(env: RulesTestEnvironment, uid: string, email: string): RulesTestContext {
  return env.authenticatedContext(uid, { email, email_verified: true });
}

/** Signed-in context with a verified phone number (Firebase Phone
 *  Auth). The rule engine reads `request.auth.token.phone_number`
 *  from the provided claim. */
export function authedAsPhone(
  env: RulesTestEnvironment,
  uid: string,
  phoneNumber: string,
): RulesTestContext {
  return env.authenticatedContext(uid, { phone_number: phoneNumber });
}
