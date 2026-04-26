import { expect, test } from "@playwright/test";

const PROJECT = process.env.FIREBASE_PROJECT ?? "demo-steward";
const AUTH_HOST = "127.0.0.1:9099";
const FIRESTORE_HOST = "127.0.0.1:8080";
const FAKE_API_KEY = "fake-api-key";

const STAMP = `${Date.now()}`;
const TEST_EMAIL = `e2e-snap-${STAMP}@e2e.local`;
const TEST_PASSWORD = "test1234";
const TEST_WARD_ID = `e2e-snap-${STAMP}`;
const TITLE_MARKER = `Marker-${STAMP}`;

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

async function readDocRaw(path: string): Promise<string> {
  const url = `http://${FIRESTORE_HOST}/v1/projects/${PROJECT}/databases/(default)/documents/${path}`;
  const resp = await fetch(url, { headers: { authorization: "Bearer owner" } });
  if (!resp.ok) throw new Error(`readDoc ${path} failed: ${resp.status} ${await resp.text()}`);
  return await resp.text();
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

test.describe("speaker-letter snapshot — editorStateJson reaches Firestore", () => {
  test.beforeAll(async () => {
    const user = await signUpUniqueUser();
    await writeDoc(`wards/${TEST_WARD_ID}`, {
      name: `Snapshot Test Ward ${STAMP}`,
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
      displayName: "Snapshot Test Bishop",
      calling: "bishop",
      role: "bishopric",
      active: true,
      ccOnEmails: true,
      fcmTokens: [],
    });
  });

  test("the saved letter doc carries editorStateJson with the bishop's letterhead", async ({
    page,
  }) => {
    // Bishop: sign in.
    await page.goto("/login");
    await page.getByTestId("e2e-email").fill(TEST_EMAIL);
    await page.getByTestId("e2e-password").fill(TEST_PASSWORD);
    await page.getByTestId("e2e-signin").click();
    await expect(page).toHaveURL(/\/schedule$/, { timeout: 10_000 });

    // Bishop: open the speaker-letter template editor (default seed
    // mounts a LetterheadNode at the top — no extra editing needed
    // for the regression check, but we DO drop a unique marker into
    // the body so the assertion can pin-point this run's data).
    await page.goto("/settings/templates/speaker-letter");
    const editor = page.getByRole("textbox", { name: "Speaker invitation letter" });
    await expect(editor).toBeVisible();
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.type(` ${TITLE_MARKER}`);

    // Save.
    const save = page.getByRole("button", { name: "Save changes" });
    await expect(save).toBeEnabled({ timeout: 5_000 });
    await save.click();
    await expect(page.getByText(/^Saved · /)).toBeVisible({ timeout: 10_000 });

    // The Firestore doc must now carry editorStateJson and that JSON
    // must include both the LetterheadNode (from the default seed)
    // and the bishop's typed marker. This is the regression check —
    // before the fix, the legacy markdown derivation dropped the
    // letterhead silently and the editor JSON was never persisted to
    // the snapshot at all.
    const raw = await readDocRaw(`wards/${TEST_WARD_ID}/templates/speakerLetter`);
    expect(raw, "speakerLetter doc must exist after save").toBeTruthy();
    expect(raw, "editorStateJson field must be present on the saved doc").toContain(
      "editorStateJson",
    );
    // Pull the editorStateJson literal value out — Firestore REST
    // wraps it in `{stringValue: "..."}` with escaped JSON inside.
    const editorStateMatch = raw.match(
      /"editorStateJson":\s*\{\s*"stringValue":\s*"((?:[^"\\]|\\.)*)"/,
    );
    expect(editorStateMatch?.[1], "editorStateJson stringValue must be readable").toBeTruthy();
    const editorJson = JSON.parse(`"${editorStateMatch![1]}"`);
    expect(editorJson, "JSON must mention the letterhead node type").toContain(
      '"type":"letterhead"',
    );
    expect(editorJson, "JSON must carry the bishop's marker text").toContain(TITLE_MARKER);
  });
});
