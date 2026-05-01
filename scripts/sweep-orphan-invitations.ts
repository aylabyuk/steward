import admin from "firebase-admin";

/**
 * Each call to `sendSpeakerInvitation` creates a brand-new
 * `speakerInvitations/{autoId}` doc and updates the speaker / prayer's
 * `invitationId` to point at the new one. Prior invitation docs become
 * orphans — their old SMS/email links keep resolving to stale content,
 * which surfaces as "the speaker sees the unedited template" when the
 * bishop is testing with a recycled link.
 *
 * This script enumerates every speaker + prayer in a ward, builds the
 * set of currently-referenced invitationIds, and deletes every other
 * `speakerInvitations/*` doc. Dry-run by default — pass `--commit` to
 * actually delete.
 *
 * Usage:
 *   pnpm tsx scripts/sweep-orphan-invitations.ts --ward stv1
 *   pnpm tsx scripts/sweep-orphan-invitations.ts --ward stv1 --commit
 */

interface Args {
  wardId: string;
  commit: boolean;
  projectId: string;
}

function parseArgs(argv: readonly string[]): Args {
  const get = (flag: string): string | undefined => {
    const idx = argv.indexOf(flag);
    return idx >= 0 ? argv[idx + 1] : undefined;
  };
  const wardId = get("--ward");
  if (!wardId) {
    console.error("Missing --ward <wardId>");
    process.exit(2);
  }
  return {
    wardId,
    commit: argv.includes("--commit"),
    projectId: get("--project") ?? process.env.GCLOUD_PROJECT ?? "steward-dev-5e4dc",
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  admin.initializeApp({ projectId: args.projectId });
  const db = admin.firestore();

  const wardRef = db.doc(`wards/${args.wardId}`);
  const wardSnap = await wardRef.get();
  if (!wardSnap.exists) {
    console.error(`Ward ${args.wardId} not found in project ${args.projectId}`);
    process.exit(1);
  }

  const referenced = new Set<string>();
  const meetings = await wardRef.collection("meetings").get();
  for (const meeting of meetings.docs) {
    const speakers = await meeting.ref.collection("speakers").get();
    for (const s of speakers.docs) {
      const id = (s.data() as { invitationId?: string }).invitationId;
      if (id) referenced.add(id);
    }
    const prayers = await meeting.ref.collection("prayers").get();
    for (const p of prayers.docs) {
      const id = (p.data() as { invitationId?: string }).invitationId;
      if (id) referenced.add(id);
    }
  }

  const invitations = await wardRef.collection("speakerInvitations").get();
  const orphans = invitations.docs.filter((d) => !referenced.has(d.id));

  console.log(
    `Ward ${args.wardId} (project ${args.projectId}): ` +
      `${invitations.size} invitations, ${referenced.size} referenced, ` +
      `${orphans.length} orphan(s).`,
  );
  if (orphans.length === 0) return;

  for (const o of orphans) {
    const data = o.data() as {
      speakerName?: string;
      speakerRef?: { meetingDate?: string };
      createdAt?: { toDate?: () => Date };
    };
    const created = data.createdAt?.toDate?.()?.toISOString() ?? "?";
    console.log(
      `  - ${o.id}  speaker=${data.speakerName ?? "?"}  ` +
        `meeting=${data.speakerRef?.meetingDate ?? "?"}  created=${created}`,
    );
  }

  if (!args.commit) {
    console.log("\nDry-run only. Re-run with --commit to delete the orphan(s) above.");
    return;
  }

  console.log(`\nDeleting ${orphans.length} orphan(s)...`);
  for (const o of orphans) {
    await db.recursiveDelete(o.ref);
  }
  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
