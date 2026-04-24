// Emits public/firebase-messaging-sw.js from
// public/firebase-messaging-sw.template.js. Historically this
// substituted __VITE_FIREBASE_*__ placeholders with values from
// process.env so the SW could call `firebase.initializeApp(...)`.
// The SW no longer imports the Firebase SDK (it handles the raw Web
// Push `push` event directly), so no substitution is needed — the
// script now just copies the template into place. Kept as a
// compilation step so Vite dev + build + CI all regenerate in lockstep.
//
// We intentionally emit the file into public/ rather than dist/ so both
// `vite dev` (which serves public/) and `vite build` (which copies
// public/ to dist/) pick it up.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const TEMPLATE = resolve(PROJECT_ROOT, "public/firebase-messaging-sw.template.js");
const OUT = resolve(PROJECT_ROOT, "public/firebase-messaging-sw.js");

writeFileSync(OUT, readFileSync(TEMPLATE, "utf8"), "utf8");
console.log(`[generate-sw] wrote ${OUT}`);
