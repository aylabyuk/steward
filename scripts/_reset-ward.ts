import admin from "firebase-admin";

async function main() {
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT ?? "steward-dev-5e4dc",
  });
  const db = admin.firestore();
  const wardId = process.argv[2] ?? "stv1";

  console.log(`Deleting everything under wards/${wardId}...`);
  const recursive = await db.recursiveDelete(db.doc(`wards/${wardId}`));
  console.log(`Deleted. ${recursive ?? "ok"}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
