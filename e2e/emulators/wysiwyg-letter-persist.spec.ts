import { expect, test } from "@playwright/test";

const PROJECT = process.env.FIREBASE_PROJECT ?? "demo-steward";
const AUTH_HOST = "127.0.0.1:9099";
const FIRESTORE_HOST = "127.0.0.1:8080";
const FAKE_API_KEY = "fake-api-key";

// Unique per-run identifiers so this test runs against a live shared
// emulator without wiping the developer's existing state. Pulled into
// the spec file (rather than the shared global-setup) precisely for
// that property.
const STAMP = `${Date.now()}`;
const TEST_EMAIL = `e2e-letter-${STAMP}@e2e.local`;
const TEST_PASSWORD = "test1234";
const TEST_WARD_ID = `e2e-letter-${STAMP}`;
const TYPE_MARKER = ` PERSIST-${STAMP}`;

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
  // The `owner` bearer token bypasses Firestore security rules in the
  // emulator — required so we can seed bootstrap docs (ward,
  // member-self) that the deployed rules forbid creating from the
  // client. Same trick the firebase-tools CLI uses internally.
  const resp = await fetch(url, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: "Bearer owner" },
    body: JSON.stringify({ fields }),
  });
  if (!resp.ok) throw new Error(`writeDoc ${path} failed: ${resp.status} ${await resp.text()}`);
}

async function signUpUniqueUser(): Promise<{ uid: string }> {
  const resp = await fetch(
    `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FAKE_API_KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        returnSecureToken: true,
      }),
    },
  );
  if (!resp.ok) throw new Error(`signUp failed: ${resp.status} ${await resp.text()}`);
  const data = (await resp.json()) as { localId: string };
  return { uid: data.localId };
}

test.describe("speaker-letter WYSIWYG persistence", () => {
  test.beforeAll(async () => {
    const user = await signUpUniqueUser();
    await writeDoc(`wards/${TEST_WARD_ID}`, {
      name: "Persistence Test Ward",
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
    await writeDoc(`wards/${TEST_WARD_ID}/members/${user.uid}`, {
      email: TEST_EMAIL,
      displayName: "Persistence Test Bishop",
      calling: "bishop",
      role: "bishopric",
      active: true,
      ccOnEmails: true,
      fcmTokens: [],
    });
  });

  test("typed content survives a save + page reload", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("e2e-email").fill(TEST_EMAIL);
    await page.getByTestId("e2e-password").fill(TEST_PASSWORD);
    await page.getByTestId("e2e-signin").click();
    await expect(page).toHaveURL(/\/schedule$/, { timeout: 10_000 });

    await page.goto("/settings/templates/speaker-letter");
    const editor = page.getByRole("textbox", { name: "Speaker invitation letter" });
    await expect(editor).toBeVisible();

    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.type(TYPE_MARKER);

    const save = page.getByRole("button", { name: "Save changes" });
    await expect(save).toBeEnabled({ timeout: 5_000 });
    await save.click();
    await expect(page.getByText(/^Saved · /)).toBeVisible({ timeout: 10_000 });

    await page.reload();

    const reloaded = page.getByRole("textbox", { name: "Speaker invitation letter" });
    await expect(reloaded).toBeVisible();
    await expect(reloaded).toContainText(TYPE_MARKER, { timeout: 10_000 });
  });
});
