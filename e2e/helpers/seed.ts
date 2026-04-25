// Seeds the Auth + Firestore emulators for e2e tests via REST. Avoids pulling
// firebase-admin into the root workspace just for one helper.
//
// Assumes both emulators are running on their default ports (Auth :9099 and
// Firestore :8080) under project id 'demo-steward'.

// Project ID defaults to `demo-steward` to match the firebase
// emulators:exec wrapper in `pnpm test:e2e:emulators`. When a developer
// already has emulators running under a different project ID (e.g.
// the dev server's `steward-dev-…` project), they can override via
// `FIREBASE_PROJECT=…` so seeding targets the live emulator instead
// of starting a fresh one.
const PROJECT = process.env.FIREBASE_PROJECT ?? "demo-steward";
const AUTH_HOST = "127.0.0.1:9099";
const FIRESTORE_HOST = "127.0.0.1:8080";
const FAKE_API_KEY = "fake-api-key";

export interface SeededUser {
  uid: string;
  email: string;
  password: string;
  idToken: string;
}

export interface SeedResult {
  wardId: string;
  user: SeededUser;
}

async function clearAuth(): Promise<void> {
  await fetch(`http://${AUTH_HOST}/emulator/v1/projects/${PROJECT}/accounts`, {
    method: "DELETE",
  }).catch(() => {});
}

async function clearFirestore(): Promise<void> {
  await fetch(
    `http://${FIRESTORE_HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`,
    { method: "DELETE" },
  ).catch(() => {});
}

async function signUpUser(email: string, password: string): Promise<SeededUser> {
  const resp = await fetch(
    `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FAKE_API_KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  if (!resp.ok) throw new Error(`signUp failed: ${resp.status} ${await resp.text()}`);
  const data = (await resp.json()) as { localId: string; idToken: string };
  return { uid: data.localId, email, password, idToken: data.idToken };
}

function fsValue(v: unknown): unknown {
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return { integerValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(fsValue) } };
  if (v && typeof v === "object") {
    const fields: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) fields[k] = fsValue(val);
    return { mapValue: { fields } };
  }
  if (v == null) return { nullValue: null };
  throw new Error(`unsupported value: ${typeof v}`);
}

async function writeDoc(path: string, data: Record<string, unknown>): Promise<void> {
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) fields[k] = fsValue(v);
  const url = `http://${FIRESTORE_HOST}/v1/projects/${PROJECT}/databases/(default)/documents/${path}`;
  const resp = await fetch(url, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!resp.ok) throw new Error(`writeDoc ${path} failed: ${resp.status} ${await resp.text()}`);
}

export async function seedTestEnvironment(opts: {
  wardId: string;
  email: string;
  password: string;
}): Promise<SeedResult> {
  await clearAuth();
  await clearFirestore();
  const user = await signUpUser(opts.email, opts.password);
  await writeDoc(`wards/${opts.wardId}`, {
    name: "Test Ward",
    settings: {
      timezone: "UTC",
      speakerLeadTimeDays: 14,
      scheduleHorizonWeeks: 4,
      nonMeetingSundays: [],
      nudgeSchedule: {
        wednesday: { enabled: true, hour: 19 },
        friday: { enabled: true, hour: 19 },
        saturday: { enabled: false, hour: 9 },
      },
      emailCcDefaults: {},
    },
  });
  await writeDoc(`wards/${opts.wardId}/members/${user.uid}`, {
    email: opts.email,
    displayName: "Test Bishop",
    calling: "bishop",
    role: "bishopric",
    active: true,
    ccOnEmails: true,
    fcmTokens: [],
  });
  return { wardId: opts.wardId, user };
}
