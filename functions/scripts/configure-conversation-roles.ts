import twilio from "twilio";

/** One-off admin script: grants the Twilio Conversations service's
 *  default "channel user" role the `editAnyMessage` permission so
 *  any participant in a conversation (bishopric member OR speaker)
 *  can update the attributes of any message, not just messages they
 *  authored. The chat UI uses message attributes to persist emoji
 *  reactions — without this, a speaker reacting to a bishop's
 *  message (or vice-versa) silently fails with a 403.
 *
 *  Security tradeoff: `editAnyMessage` also allows body edits, not
 *  just attributes. Twilio does not expose a narrower permission.
 *  The exposure is bounded by (a) the conversation-scoped role
 *  (only actual participants in that one conversation), (b) each
 *  edit's `updatedAt` timestamp surfacing tampering, and (c) the
 *  ward being a trusted membership in the first place. Acceptable
 *  in this context.
 *
 *  Idempotent: a second run is a no-op. Replaces the role's
 *  permission list wholesale, so we fetch first, union with
 *  editAnyMessage, and write back.
 *
 *  Run from the functions workspace:
 *    TWILIO_ACCOUNT_SID=AC... \
 *    TWILIO_AUTH_TOKEN=... \
 *    TWILIO_CONVERSATIONS_SERVICE_SID=IS... \
 *    pnpm --filter @steward/functions configure-conversation-roles
 */

interface ConversationRole {
  sid: string;
  type: "conversation" | "service";
  friendlyName: string;
  permissions: string[];
}
async function main(): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_CONVERSATIONS_SERVICE_SID;
  if (!accountSid || !authToken || !serviceSid) {
    throw new Error(
      "Missing env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_CONVERSATIONS_SERVICE_SID all required.",
    );
  }

  const client = twilio(accountSid, authToken);
  const service = client.conversations.v1.services(serviceSid);
  const roles = (await service.roles.list()) as unknown as ConversationRole[];

  const channelUser = roles.find(
    (r) => r.type === "conversation" && r.friendlyName === "channel user",
  );
  if (!channelUser) {
    throw new Error(
      `Could not find the default 'channel user' role on service ${serviceSid}. Twilio-managed roles are expected to exist; has the service been manually reconfigured?`,
    );
  }

  const current = new Set(channelUser.permissions);
  if (current.has("editAnyMessage")) {
    console.log(`channel user (${channelUser.sid}) already has editAnyMessage — no-op.`);
    return;
  }
  current.add("editAnyMessage");
  const next = [...current];

  await service.roles(channelUser.sid).update({ permission: next });
  console.log(`channel user (${channelUser.sid}) updated. Permissions:`);
  console.log(`  ${next.toSorted().join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
