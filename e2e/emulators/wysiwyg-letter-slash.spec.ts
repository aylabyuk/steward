import { expect, test } from "@playwright/test";

const PROJECT = process.env.FIREBASE_PROJECT ?? "demo-steward";
const AUTH_HOST = "127.0.0.1:9099";
const FIRESTORE_HOST = "127.0.0.1:8080";
const FAKE_API_KEY = "fake-api-key";

const STAMP = `${Date.now()}`;
const TEST_EMAIL = `e2e-slash-${STAMP}@e2e.local`;
const TEST_PASSWORD = "test1234";
const TEST_WARD_ID = `e2e-slash-${STAMP}`;

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
    headers: { "content-type": "application/json", authorization: "Bearer owner" },
    body: JSON.stringify({ fields }),
  });
  if (!resp.ok) throw new Error(`writeDoc ${path} failed: ${resp.status} ${await resp.text()}`);
}

async function signUpUser(): Promise<{ uid: string }> {
  const resp = await fetch(
    `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FAKE_API_KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, returnSecureToken: true }),
    },
  );
  if (!resp.ok) throw new Error(`signUp failed: ${resp.status} ${await resp.text()}`);
  const data = (await resp.json()) as { localId: string };
  return { uid: data.localId };
}

test.describe("speaker-letter slash command palette", () => {
  test.beforeAll(async () => {
    const user = await signUpUser();
    await writeDoc(`wards/${TEST_WARD_ID}`, {
      name: "Slash Test Ward",
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
      displayName: "Slash Test Bishop",
      calling: "bishop",
      role: "bishopric",
      active: true,
      ccOnEmails: true,
      fcmTokens: [],
    });
  });

  test("typing / opens the palette and Enter inserts a divider", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("e2e-email").fill(TEST_EMAIL);
    await page.getByTestId("e2e-password").fill(TEST_PASSWORD);
    await page.getByTestId("e2e-signin").click();
    await expect(page).toHaveURL(/\/schedule$/, { timeout: 10_000 });

    await page.goto("/settings/templates/speaker-letter");
    const editor = page.getByRole("textbox", { name: "Speaker invitation letter" });
    await expect(editor).toBeVisible();

    // Click into the editor, jump to end, then start a new paragraph
    // and trigger the slash menu.
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await page.keyboard.type("/divider");

    // The typeahead menu appears as a dialog-flavored portal — wait
    // for at least one menu item titled "Divider" (in case the
    // typeahead's a11y role differs across versions, fall back to
    // the literal label).
    await expect(page.getByText("Divider", { exact: true }).first()).toBeVisible({
      timeout: 5_000,
    });
    await page.keyboard.press("Enter");

    // After insertion the editor should contain an <hr>.
    const hrCount = await editor.locator("hr").count();
    expect(hrCount).toBeGreaterThan(0);
  });
});
