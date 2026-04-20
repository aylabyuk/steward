import { parseArgs } from "node:util";
import admin from "firebase-admin";

interface Args {
  wardId: string;
  wardName: string;
  bishopEmail: string;
  bishopName: string;
  bishopCalling: "bishop" | "first_counselor" | "second_counselor";
  timezone: string;
  project?: string;
}

function parseCli(): Args {
  const { values } = parseArgs({
    options: {
      "ward-id": { type: "string" },
      "ward-name": { type: "string" },
      "bishop-email": { type: "string" },
      "bishop-name": { type: "string" },
      "bishop-calling": { type: "string", default: "bishop" },
      timezone: { type: "string", default: "UTC" },
      project: { type: "string" },
    },
    strict: true,
  });

  const required = ["ward-id", "ward-name", "bishop-email", "bishop-name"] as const;
  for (const key of required) {
    if (!values[key]) {
      throw new Error(`Missing required flag: --${key}`);
    }
  }

  const calling = values["bishop-calling"];
  if (calling !== "bishop" && calling !== "first_counselor" && calling !== "second_counselor") {
    throw new Error(
      `--bishop-calling must be bishop | first_counselor | second_counselor, got: ${calling}`,
    );
  }

  return {
    wardId: values["ward-id"] as string,
    wardName: values["ward-name"] as string,
    bishopEmail: values["bishop-email"] as string,
    bishopName: values["bishop-name"] as string,
    bishopCalling: calling,
    timezone: values.timezone as string,
    project: values.project,
  };
}

async function resolveBishopUid(email: string, displayName: string): Promise<string> {
  try {
    const existing = await admin.auth().getUserByEmail(email);
    return existing.uid;
  } catch (error) {
    if ((error as { code?: string }).code !== "auth/user-not-found") throw error;
    const created = await admin.auth().createUser({ email, displayName });
    console.log(`Created Auth user ${created.uid} for ${email}`);
    return created.uid;
  }
}

function defaultSettings(timezone: string) {
  return {
    timezone,
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
}

async function main() {
  const args = parseCli();

  admin.initializeApp({
    projectId: args.project ?? process.env.GCLOUD_PROJECT ?? "steward-dev-5e4dc",
  });

  const uid = await resolveBishopUid(args.bishopEmail, args.bishopName);
  const db = admin.firestore();

  const wardRef = db.collection("wards").doc(args.wardId);
  const memberRef = wardRef.collection("members").doc(uid);

  const existing = await wardRef.get();
  if (existing.exists) {
    throw new Error(`Ward ${args.wardId} already exists; refusing to overwrite.`);
  }

  const batch = db.batch();
  batch.set(wardRef, {
    name: args.wardName,
    settings: defaultSettings(args.timezone),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  batch.set(memberRef, {
    email: args.bishopEmail,
    displayName: args.bishopName,
    calling: args.bishopCalling,
    role: "bishopric",
    active: true,
    ccOnEmails: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await batch.commit();

  console.log(`Bootstrapped ward "${args.wardName}" (${args.wardId})`);
  console.log(`  bishop: ${args.bishopName} <${args.bishopEmail}> uid=${uid}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
