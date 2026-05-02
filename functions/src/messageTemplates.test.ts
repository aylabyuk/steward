import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_MESSAGE_TEMPLATES } from "./messageTemplateDefaults.js";
import { interpolate, neutralizeMustaches, readMessageTemplate } from "./messageTemplates.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLIENT_DEFAULTS_PATH = resolve(
  __dirname,
  "../../src/features/templates/utils/serverTemplateDefaults.ts",
);

describe("interpolate", () => {
  it("replaces known tokens from the vars map", () => {
    expect(interpolate("Hello {{name}}", { name: "Paul" })).toBe("Hello Paul");
  });

  it("leaves unknown tokens literal so authoring typos stay visible", () => {
    expect(interpolate("{{missing}} and {{name}}", { name: "Paul" })).toBe("{{missing}} and Paul");
  });

  it("tolerates whitespace inside the braces", () => {
    expect(interpolate("{{  name  }}", { name: "Paul" })).toBe("Paul");
  });

  it("preserves multi-line bodies", () => {
    const template = "line 1: {{a}}\n\nline 3: {{b}}";
    expect(interpolate(template, { a: "x", b: "y" })).toBe("line 1: x\n\nline 3: y");
  });
});

describe("neutralizeMustaches", () => {
  it("breaks `{{` patterns by inserting a space", () => {
    expect(neutralizeMustaches("hello {{inviteUrl}} world")).toBe("hello { {inviteUrl}} world");
  });

  it("does not regex-match a neutralized value when re-fed to interpolate", () => {
    const preview = neutralizeMustaches("see {{inviteUrl}}");
    const out = interpolate("preview: {{preview}}", { preview, inviteUrl: "SECRET" });
    expect(out).toBe("preview: see { {inviteUrl}}");
    expect(out).not.toContain("SECRET");
  });

  it("leaves text without mustaches untouched", () => {
    expect(neutralizeMustaches("plain text — no braces")).toBe("plain text — no braces");
  });

  it("neutralizes every occurrence", () => {
    expect(neutralizeMustaches("{{a}} and {{b}}")).toBe("{ {a}} and { {b}}");
  });
});

function makeDb(
  docs: Record<string, { bodyMarkdown?: unknown } | null>,
): FirebaseFirestore.Firestore {
  return {
    doc(path: string) {
      return {
        async get() {
          const entry = docs[path];
          if (entry === null || entry === undefined) {
            return { exists: false, get() {} };
          }
          return {
            exists: true,
            get(field: string) {
              return (entry as Record<string, unknown>)[field];
            },
          };
        },
      };
    },
  } as unknown as FirebaseFirestore.Firestore;
}

describe("readMessageTemplate", () => {
  it("falls back to the default when the doc is missing", async () => {
    const db = makeDb({});
    const body = await readMessageTemplate(db, "w1", "initialInvitationSms");
    expect(body).toBe(DEFAULT_MESSAGE_TEMPLATES.initialInvitationSms);
  });

  it("returns bodyMarkdown from the Firestore doc when present", async () => {
    const db = makeDb({
      "wards/w1/templates/initialInvitationSms": { bodyMarkdown: "custom body" },
    });
    const body = await readMessageTemplate(db, "w1", "initialInvitationSms");
    expect(body).toBe("custom body");
  });

  it("falls back when bodyMarkdown is empty or the wrong type", async () => {
    const emptyDb = makeDb({ "wards/w1/templates/bishopReplyEmail": { bodyMarkdown: "" } });
    expect(await readMessageTemplate(emptyDb, "w1", "bishopReplyEmail")).toBe(
      DEFAULT_MESSAGE_TEMPLATES.bishopReplyEmail,
    );
    const wrongTypeDb = makeDb({
      "wards/w1/templates/bishopReplyEmail": { bodyMarkdown: 42 },
    });
    expect(await readMessageTemplate(wrongTypeDb, "w1", "bishopReplyEmail")).toBe(
      DEFAULT_MESSAGE_TEMPLATES.bishopReplyEmail,
    );
  });

  it("swallows unexpected errors and returns the fallback", async () => {
    const db = {
      doc() {
        return {
          async get() {
            throw new Error("network");
          },
        };
      },
    } as unknown as FirebaseFirestore.Firestore;
    const body = await readMessageTemplate(db, "w1", "speakerResponseAccepted");
    expect(body).toBe(DEFAULT_MESSAGE_TEMPLATES.speakerResponseAccepted);
  });
});

describe("default templates drift check (client vs server)", () => {
  it("client-side serverTemplateDefaults.ts matches server-side messageTemplateDefaults.ts", async () => {
    const source = await fs.readFile(CLIENT_DEFAULTS_PATH, "utf8");
    const clientValues: Record<string, string> = {};
    for (const key of Object.keys(DEFAULT_MESSAGE_TEMPLATES)) {
      const constName = `DEFAULT_${camelToUpperSnake(key)}`;
      clientValues[key] = evalConstant(source, constName);
    }
    expect(clientValues).toEqual(DEFAULT_MESSAGE_TEMPLATES);
  });
});

/**
 * Extract the RHS of `export const <name> = <expr>;` from a TS source
 * file and evaluate it as plain JS. The RHS for every DEFAULT_* in
 * `serverTemplateDefaults.ts` is a valid JS expression (string literal,
 * string concat, or array-join) — no TS-only syntax — so the Function
 * constructor handles it without a TS compiler step.
 */
function evalConstant(source: string, name: string): string {
  const re = new RegExp(`export const ${name}\\s*=\\s*([\\s\\S]*?);\\s*$`, "m");
  const match = re.exec(source);
  if (!match || !match[1]) throw new Error(`constant ${name} not found in client defaults`);
  const result = new Function(`return (${match[1]})`)();
  if (typeof result !== "string") {
    throw new Error(`constant ${name} did not evaluate to a string`);
  }
  return result;
}

function camelToUpperSnake(camel: string): string {
  return camel.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase();
}
