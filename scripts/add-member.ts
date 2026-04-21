import { parseArgs } from "node:util";
import admin from "firebase-admin";

type Calling =
  | "bishop"
  | "first_counselor"
  | "second_counselor"
  | "executive_secretary"
  | "assistant_executive_secretary"
  | "ward_clerk"
  | "assistant_clerk";

type Role = "bishopric" | "clerk";

const CALLINGS: readonly Calling[] = [
  "bishop",
  "first_counselor",
  "second_counselor",
  "executive_secretary",
  "assistant_executive_secretary",
  "ward_clerk",
  "assistant_clerk",
];

function callingToRole(calling: Calling): Role {
  if (calling === "bishop" || calling === "first_counselor" || calling === "second_counselor") {
    return "bishopric";
  }
  return "clerk";
}

interface Args {
  wardId: string;
  email: string;
  name: string;
  calling: Calling;
  project?: string;
}

function parseCli(): Args {
  const { values } = parseArgs({
    options: {
      "ward-id": { type: "string" },
      email: { type: "string" },
      name: { type: "string" },
      calling: { type: "string" },
      project: { type: "string" },
    },
    strict: true,
  });

  const required = ["ward-id", "email", "name", "calling"] as const;
  for (const key of required) {
    if (!values[key]) {
      throw new Error(`Missing required flag: --${key}`);
    }
  }

  const calling = values.calling as string;
  if (!CALLINGS.includes(calling as Calling)) {
    throw new Error(`--calling must be one of: ${CALLINGS.join(", ")}`);
  }

  return {
    wardId: values["ward-id"] as string,
    email: values.email as string,
    name: values.name as string,
    calling: calling as Calling,
    project: values.project,
  };
}

async function resolveUid(email: string, displayName: string): Promise<string> {
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

async function main() {
  const args = parseCli();

  admin.initializeApp({
    projectId: args.project ?? process.env.GCLOUD_PROJECT ?? "steward-dev-5e4dc",
  });

  const uid = await resolveUid(args.email, args.name);
  const db = admin.firestore();

  const wardRef = db.collection("wards").doc(args.wardId);
  const memberRef = wardRef.collection("members").doc(uid);

  const wardSnap = await wardRef.get();
  if (!wardSnap.exists) {
    throw new Error(
      `Ward ${args.wardId} does not exist. Run bootstrap-ward first or check the id.`,
    );
  }

  const role = callingToRole(args.calling);
  const existing = await memberRef.get();
  await memberRef.set(
    {
      email: args.email,
      displayName: args.name,
      calling: args.calling,
      role,
      active: true,
      ccOnEmails: true,
      fcmTokens: [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(existing.exists ? {} : { createdAt: admin.firestore.FieldValue.serverTimestamp() }),
    },
    { merge: true },
  );

  console.log(
    `${existing.exists ? "Updated" : "Added"} ${args.name} <${args.email}> as ${args.calling} (${role}) in ward ${args.wardId}`,
  );
  console.log(`  uid: ${uid}`);
  console.log(`  path: wards/${args.wardId}/members/${uid}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
