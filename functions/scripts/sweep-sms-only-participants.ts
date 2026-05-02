import twilio from "twilio";

/** One-time admin script: removes every SMS-only Conversations
 *  participant in the configured Conversations service.
 *
 *  Why this exists: from v0.20.2 forward we no longer add an SMS-only
 *  participant for the speaker's phone (#227). Inbound speaker SMS is
 *  relayed server-side (twilio/inboundSmsRelay.ts) into the active
 *  invitation's conversation, authored as `speaker:{invitationId}`.
 *
 *  Older invitations created on prior code paths still have SMS-only
 *  participants attached — Twilio's auto-bridge keeps routing inbound
 *  to those conversations *in addition to* the new MS inboundRequestUrl
 *  → relay path, so the bishop sees double messages in two different
 *  chatboxes (one per active invitation that shares the speaker phone).
 *
 *  Definition of an "SMS-only participant" for this sweep: any
 *  participant whose `messagingBinding` is non-null AND whose
 *  `identity` is null. Combined-binding participants (identity +
 *  binding) shouldn't exist on this account anyway — Twilio rejects
 *  them with error "Participants on SMS, WhatsApp or other non-chat
 *  channels cannot have Identities" — but the filter is defensive.
 *
 *  Idempotent: a second run finds nothing to remove.
 *
 *  Run from the functions workspace:
 *    TWILIO_ACCOUNT_SID=AC... \
 *    TWILIO_AUTH_TOKEN=... \
 *    TWILIO_CONVERSATIONS_SERVICE_SID=IS... \
 *    pnpm --filter @steward/functions tsx scripts/sweep-sms-only-participants.ts
 *
 *  Dry-run by default. Pass `--commit` to actually remove. */

interface ConversationLike {
  sid: string;
  friendlyName?: string | null;
}

interface ParticipantLike {
  sid: string;
  identity?: string | null;
  messagingBinding?: { address?: string | null; proxy_address?: string | null } | null;
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
  const commit = process.argv.includes("--commit");

  const client = twilio(accountSid, authToken);
  const service = client.conversations.v1.services(serviceSid);

  const conversations = (await service.conversations.list()) as unknown as ConversationLike[];
  console.log(
    `Service ${serviceSid}: scanning ${conversations.length} conversation(s) for SMS-only participants...`,
  );

  const targets: {
    conversationSid: string;
    conversationName: string;
    participantSid: string;
    address: string;
  }[] = [];
  for (const c of conversations) {
    const participants = (await service
      .conversations(c.sid)
      .participants.list()) as unknown as ParticipantLike[];
    for (const p of participants) {
      if (p.identity) continue;
      if (!p.messagingBinding?.address) continue;
      targets.push({
        conversationSid: c.sid,
        conversationName: c.friendlyName ?? "(no name)",
        participantSid: p.sid,
        address: p.messagingBinding.address,
      });
    }
  }

  if (targets.length === 0) {
    console.log("No SMS-only participants found. Nothing to do.");
    return;
  }

  console.log(`\nFound ${targets.length} SMS-only participant(s):`);
  for (const t of targets) {
    console.log(
      `  - ${t.participantSid}  conversation=${t.conversationSid} (${t.conversationName})  address=${t.address}`,
    );
  }

  if (!commit) {
    console.log("\nDry-run only. Re-run with --commit to remove the participant(s) above.");
    return;
  }

  console.log(`\nRemoving ${targets.length} participant(s)...`);
  let removed = 0;
  for (const t of targets) {
    try {
      await service.conversations(t.conversationSid).participants(t.participantSid).remove();
      removed++;
    } catch (err) {
      console.error(
        `  ! failed ${t.participantSid} in ${t.conversationSid}: ${(err as Error).message}`,
      );
    }
  }
  console.log(`Done. Removed ${removed}/${targets.length}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
