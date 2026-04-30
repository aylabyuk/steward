import { expect, test, type Page } from "@playwright/test";

const PROJECT = process.env.FIREBASE_PROJECT ?? "demo-steward";
const AUTH_HOST = "127.0.0.1:9099";
const FIRESTORE_HOST = "127.0.0.1:8080";
const FAKE_API_KEY = "fake-api-key";

const STAMP = `${Date.now()}`;
const TEST_EMAIL = `e2e-prep-${STAMP}@e2e.local`;
const TEST_PASSWORD = "test1234";
const TEST_WARD_ID = `e2e-prep-${STAMP}`;
const SPEAKER_ID = "spk-1";
const PRAYER_ROLE = "opening";
const MEETING_DATE = "2026-04-26";
const BODY_MARKER = `BODY-MARK-${STAMP}`;

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

async function signIn(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByTestId("e2e-email").fill(TEST_EMAIL);
  await page.getByTestId("e2e-password").fill(TEST_PASSWORD);
  await page.getByTestId("e2e-signin").click();
  await expect(page).toHaveURL(/\/schedule$/, { timeout: 10_000 });
}

async function openPrepare(page: Page): Promise<void> {
  await page.goto(`/week/${MEETING_DATE}/speaker/${SPEAKER_ID}/prepare`);
  await expect(page.getByRole("heading", { name: "Sister Test" })).toBeVisible({
    timeout: 10_000,
  });
}

async function expectEditorVisible(page: Page): Promise<void> {
  // The Lexical contenteditable doesn't carry an explicit role,
  // so target it by its aria-label which the LetterPageEditor sets
  // to `Letter for {speakerName}`.
  await expect(page.locator('[aria-label="Letter for Sister Test"]')).toBeVisible({
    timeout: 10_000,
  });
}

test.describe("Prepare Invitation page", () => {
  test.beforeAll(async () => {
    const user = await signUpUser();
    await writeDoc(`wards/${TEST_WARD_ID}`, {
      name: `Prepare Test Ward ${STAMP}`,
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
      displayName: "Prepare Test Bishop",
      calling: "bishop",
      role: "bishopric",
      active: true,
      ccOnEmails: true,
      fcmTokens: [],
    });
    await writeDoc(`wards/${TEST_WARD_ID}/meetings/${MEETING_DATE}`, {
      date: MEETING_DATE,
      type: "regular",
      status: "draft",
    });
    await writeDoc(`wards/${TEST_WARD_ID}/meetings/${MEETING_DATE}/speakers/${SPEAKER_ID}`, {
      name: "Sister Test",
      email: "sister@example.com",
      phone: "",
      topic: "Faith",
      role: "Member",
      status: "planned",
    });
    await writeDoc(`wards/${TEST_WARD_ID}/meetings/${MEETING_DATE}/prayers/${PRAYER_ROLE}`, {
      name: "Brother Pray",
      email: "",
      phone: "",
      role: PRAYER_ROLE,
      status: "planned",
    });
  });

  test.beforeEach(async ({ page }) => {
    // AuthGate auto-resolves wardId for single-ward members, so signing
    // in is enough to land us on /schedule with currentWardStore set.
    await signIn(page);
  });

  test("Send Invitation CTA lives in the page header at every breakpoint", async ({ page }) => {
    // Desktop viewport. iOS-parity check: the primary CTA must be a
    // visible, labeled button in the sticky header at every size, not
    // a floating overlay on the editor.
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPrepare(page);
    const desktopCta = page.getByRole("button", { name: /send invitation/i });
    await expect(desktopCta).toBeVisible();
    expect(
      await desktopCta.evaluate((el) => Boolean(el.closest("header"))),
      "CTA must live in the page header on desktop",
    ).toBe(true);

    // Mobile viewport — mobile header stacks the action bar under
    // the title row. The Send Invitation button must remain in the
    // header (not buried inside the editor surface).
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/week/${MEETING_DATE}/speaker/${SPEAKER_ID}/prepare`);
    await expect(page.getByRole("heading", { name: "Sister Test" })).toBeVisible({
      timeout: 10_000,
    });
    const mobileCta = page.getByRole("button", { name: /send invitation/i });
    await expect(mobileCta).toBeVisible();
    expect(
      await mobileCta.evaluate((el) => Boolean(el.closest("header"))),
      "CTA must live in the page header on mobile too",
    ).toBe(true);
  });

  test("toolbar bottom border runs edge-to-edge across the viewport", async ({ page }) => {
    // Desktop only — mobile uses a separate read-only preview that
    // doesn't render the editor toolbar.
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPrepare(page);
    const toolbar = page.locator(".tb-toolbar").first();
    await expect(toolbar).toBeVisible({ timeout: 10_000 });
    const rect = await toolbar.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right };
    });
    const vpWidth = page.viewportSize()?.width ?? 0;
    expect(rect.left, "toolbar left should hit viewport edge").toBeLessThanOrEqual(1);
    expect(
      Math.abs(rect.right - vpWidth),
      "toolbar right should hit viewport edge",
    ).toBeLessThanOrEqual(1);
  });

  test("bishop's edits persist to letterOverride.editorStateJson before any send", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPrepare(page);
    await expectEditorVisible(page);
    const editor = page.locator('[aria-label="Letter for Sister Test"]');
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.type(` ${BODY_MARKER}`);

    // "Mark invited only" runs through the same persistOverrides path
    // that Send uses — but without invoking the Twilio-backed
    // sendSpeakerInvitation callable (which the e2e emulators don't
    // host). If the bishop's edits make it into letterOverride here,
    // they will also flow into the speakerInvitations snapshot when
    // Send fires.
    await page.getByRole("button", { name: "Mark invited only" }).click();
    await page.getByRole("button", { name: /^mark invited$/i }).click();

    await expect(page.getByRole("heading", { name: "Invitation sent" })).toBeVisible({
      timeout: 10_000,
    });

    const raw = await readDocRaw(
      `wards/${TEST_WARD_ID}/meetings/${MEETING_DATE}/speakers/${SPEAKER_ID}`,
    );
    expect(raw, "speaker doc must exist after Mark invited").toBeTruthy();
    expect(raw, "letterOverride must be populated").toContain("letterOverride");
    expect(raw, "editorStateJson must carry the bishop's marker").toContain(BODY_MARKER);
  });
});
