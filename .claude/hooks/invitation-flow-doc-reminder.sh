#!/usr/bin/env bash
# Posted-tool hook: nudges the agent to update docs/invitation-flow.md
# after editing any file in the invitation flow surface area.
#
# Reads PostToolUse JSON on stdin, emits a system-reminder JSON on stdout
# only when the edited path matches. See .claude/skills/invitation-flow-doc-sync.md
# for the surface area + decision rules.

set -u

path=$(jq -r '.tool_input.file_path // ""' 2>/dev/null) || exit 0
[[ -z "$path" ]] && exit 0

# Extended-regex pattern listing every path in the invitation flow surface.
pattern='(functions/src/(sendSpeakerInvitation|freshInvitation|rotateInvitationLink|issueSpeakerSession|issueSpeakerSession\.helpers|onInvitationWrite|onTwilioWebhook|invitationDelivery|invitationResponseNotify|invitationReplyNotify|invitationReplyPush|invitationToken|invitationTypes|messageTemplates|emailTemplateBody)\.ts|functions/src/(twilio|sendgrid)/|src/app/routes/(assign-speaker|assign-prayer|prepare-invitation|prepare-prayer-invitation|invite-speaker)/|src/features/invitations/|src/lib/types/speakerInvitation\.ts)'

if echo "$path" | grep -qE "$pattern"; then
  jq -nc --arg p "$path" '{
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: ("Edited \($p), which is part of the invitation flow surface area. If this change is doc-relevant (new phase, delivery channel, token-lifecycle change, recipient-set change, file rename in the source-files table, etc.), update docs/invitation-flow.md in the same PR. Skip the doc update for cosmetic refactors / template-key parity / quiet-hours tweaks. See .claude/skills/invitation-flow-doc-sync.md for the full decision rubric.")
    }
  }'
fi

exit 0
