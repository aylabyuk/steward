import admin from "firebase-admin";

/**
 * One-time migration for the C1 doc-split fix.
 *
 * Walks every `wards/{wardId}/speakerInvitations/{id}` doc and:
 *  1. Writes the private fields (token state, contact PII, bishopric
 *     snapshot, full response, presence heartbeat, deliveryRecord,
 *     fromNumberMode) to the new auth subdoc at
 *     `…/{id}/private/auth`.
 *  2. Mirrors `response.{answer, respondedAt}` (when present) to the
 *     parent doc as `responseSummary` so the public landing page can
 *     render the post-response gate without reading the auth subdoc.
 *  3. Deletes the migrated fields from the parent doc.
 *
 * Idempotent: re-running on a partially-migrated invitation is a no-op
 * (skips invitations whose parent no longer carries any private
 * fields). Dry-run by default — pass `--commit` to actually write.
 *
 * Usage (run AFTER the new code has deployed):
 *   pnpm tsx scripts/migrate-invitation-doc-split.ts --project steward-prod-65a36
 *   pnpm tsx scripts/migrate-invitation-doc-split.ts --project steward-prod-65a36 --commit
 *   # restrict to one ward:
 *   pnpm tsx scripts/migrate-invitation-doc-split.ts --project steward-prod-65a36 --ward stv1
 */

interface Args {
  projectId: string;
  wardId?: string;
  commit: boolean;
}

const PRIVATE_FIELDS = [
  "tokenHash",
  "tokenStatus",
  "tokenExpiresAt",
  "tokenRotationsByDay",
  "speakerEmail",
  "speakerPhone",
  "bishopricParticipants",
  "response",
  "speakerLastSeenAt",
  "fromNumberMode",
  "deliveryRecord",
] as const;

type FieldName = (typeof PRIVATE_FIELDS)[number];

function parseArgs(argv: readonly string[]): Args {
  const get = (flag: string): string | undefined => {
    const idx = argv.indexOf(flag);
    return idx >= 0 ? argv[idx + 1] : undefined;
  };
  return {
    projectId: get("--project") ?? process.env.GCLOUD_PROJECT ?? "steward-dev-5e4dc",
    ...(get("--ward") ? { wardId: get("--ward")! } : {}),
    commit: argv.includes("--commit"),
  };
}

interface Tally {
  scanned: number;
  alreadyMigrated: number;
  toMigrate: number;
  migrated: number;
  failed: number;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  admin.initializeApp({ projectId: args.projectId });
  const db = admin.firestore();
  const tally: Tally = {
    scanned: 0,
    alreadyMigrated: 0,
    toMigrate: 0,
    migrated: 0,
    failed: 0,
  };

  const wardIds = args.wardId ? [args.wardId] : await listWardIds(db);
  console.log(
    `Migration scan: project=${args.projectId} wards=${wardIds.length}` +
      (args.commit ? " commit=YES" : " (dry-run)"),
  );

  for (const wardId of wardIds) {
    const invitations = await db.collection(`wards/${wardId}/speakerInvitations`).get();
    for (const inv of invitations.docs) {
      tally.scanned++;
      const data = inv.data() as Record<string, unknown>;
      const present = PRIVATE_FIELDS.filter((f) => data[f] !== undefined);
      if (present.length === 0) {
        tally.alreadyMigrated++;
        continue;
      }
      tally.toMigrate++;
      const authPayload: Record<string, unknown> = {};
      for (const f of present) authPayload[f] = data[f];
      const responseSummary = buildResponseSummary(data);
      console.log(
        `  - ${wardId}/${inv.id}  fields=${present.join(",")}` +
          (responseSummary ? " responseSummary=" + JSON.stringify(responseSummary) : ""),
      );
      if (!args.commit) continue;
      try {
        await migrateOne(db, inv.ref, authPayload, responseSummary, present);
        tally.migrated++;
      } catch (err) {
        tally.failed++;
        console.error(`    ! failed: ${(err as Error).message}`);
      }
    }
  }

  console.log("");
  console.log(
    `Result: scanned=${tally.scanned} alreadyMigrated=${tally.alreadyMigrated} ` +
      `toMigrate=${tally.toMigrate} migrated=${tally.migrated} failed=${tally.failed}`,
  );
  if (!args.commit && tally.toMigrate > 0) {
    console.log("Dry-run only. Re-run with --commit to apply.");
  }
}

async function listWardIds(db: admin.firestore.Firestore): Promise<string[]> {
  const snap = await db.collection("wards").get();
  return snap.docs.map((d) => d.id);
}

function buildResponseSummary(data: Record<string, unknown>): {
  answer: "yes" | "no";
  respondedAt: unknown;
} | null {
  const response = data["response"] as
    | { answer?: "yes" | "no"; respondedAt?: unknown }
    | undefined;
  if (!response?.answer || !response.respondedAt) return null;
  return { answer: response.answer, respondedAt: response.respondedAt };
}

async function migrateOne(
  db: admin.firestore.Firestore,
  parentRef: admin.firestore.DocumentReference,
  authPayload: Record<string, unknown>,
  responseSummary: { answer: "yes" | "no"; respondedAt: unknown } | null,
  fieldsToDelete: readonly FieldName[],
): Promise<void> {
  const authRef = parentRef.collection("private").doc("auth");
  const batch = db.batch();
  // Use set with merge so we don't clobber any auth fields written by
  // a Cloud Function that may have raced ahead post-deploy.
  batch.set(authRef, authPayload, { merge: true });
  const parentPatch: Record<string, unknown> = {};
  for (const f of fieldsToDelete) {
    parentPatch[f] = admin.firestore.FieldValue.delete();
  }
  if (responseSummary) parentPatch["responseSummary"] = responseSummary;
  batch.update(parentRef, parentPatch);
  await batch.commit();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
