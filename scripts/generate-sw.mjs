// Generates public/firebase-messaging-sw.js from
// public/firebase-messaging-sw.template.js, substituting __VITE_FIREBASE_*__
// placeholders with values from process.env. In local dev, .env.local is loaded
// from the project root before this script runs (predev/prebuild hooks). CI
// already exports the same vars in the workflow.
//
// We intentionally emit the file into public/ rather than dist/ so both `vite
// dev` (which serves public/) and `vite build` (which copies public/ to dist/)
// pick it up.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const TEMPLATE = resolve(PROJECT_ROOT, "public/firebase-messaging-sw.template.js");
const OUT = resolve(PROJECT_ROOT, "public/firebase-messaging-sw.js");

const REQUIRED = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

function loadDotenvLocal() {
  try {
    const content = readFileSync(resolve(PROJECT_ROOT, ".env.local"), "utf8");
    for (const line of content.split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (!m) continue;
      const [, key, raw] = m;
      if (process.env[key] !== undefined) continue;
      const value = raw.replace(/^['"]|['"]$/g, "");
      process.env[key] = value;
    }
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
}

loadDotenvLocal();

const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(
    `[generate-sw] missing required env: ${missing.join(", ")}. Set them in .env.local or your CI environment.`,
  );
  process.exit(1);
}

const template = readFileSync(TEMPLATE, "utf8");
const out = REQUIRED.reduce(
  (acc, key) => acc.replaceAll(`__${key}__`, process.env[key] ?? ""),
  template,
);
writeFileSync(OUT, out, "utf8");
console.log(`[generate-sw] wrote ${OUT}`);
