import { seedTestEnvironment } from "./helpers/seed";

export const TEST_USER = {
  email: "bishop@e2e.local",
  password: "test1234",
};
export const TEST_WARD_ID = "e2e-ward";

async function ensureEmulatorsUp(): Promise<void> {
  const ports = [9099, 8080];
  const probes = await Promise.allSettled(ports.map((p) => fetch(`http://127.0.0.1:${p}/`)));
  probes.forEach((result, i) => {
    if (result.status === "rejected") {
      throw new Error(
        `Firebase emulator not reachable on port ${ports[i]}. Start with \`pnpm emulators\` first.`,
      );
    }
  });
}

export default async function globalSetup(): Promise<void> {
  await ensureEmulatorsUp();
  await seedTestEnvironment({
    wardId: TEST_WARD_ID,
    email: TEST_USER.email,
    password: TEST_USER.password,
  });
}
