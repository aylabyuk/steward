---
name: invitation-flow-doc-sync
description: Keep docs/invitation-flow.md aligned with the speaker/prayer invitation pipeline. Trigger whenever editing any file in the invitation flow surface area (list below). Decide whether the change is doc-relevant; if yes, update the doc in the same PR.
---

# Invitation flow doc sync

`docs/invitation-flow.md` is the canonical map of the speaker/prayer
invitation pipeline — it has a bishopric-facing flowchart and an
engineering sequence diagram, plus a source-files table. The doc only
stays useful if it's updated alongside the code it describes.

## Trigger

Activate this skill whenever you touch any file in the invitation
flow surface area. Treat any of the following as the trigger — file
edits, renames, deletes, or adding a new file in these directories:

**Cloud Functions (the canonical "what happens" surface):**
- `functions/src/sendSpeakerInvitation.ts`
- `functions/src/freshInvitation.ts`
- `functions/src/rotateInvitationLink.ts`
- `functions/src/issueSpeakerSession.ts`
- `functions/src/issueSpeakerSession.helpers.ts`
- `functions/src/onInvitationWrite.ts`
- `functions/src/onTwilioWebhook.ts`
- `functions/src/invitationDelivery.ts`
- `functions/src/invitationResponseNotify.ts`
- `functions/src/invitationReplyNotify.ts`
- `functions/src/invitationReplyPush.ts`
- `functions/src/invitationToken.ts`
- `functions/src/invitationTypes.ts`
- `functions/src/messageTemplates.ts`
- `functions/src/emailTemplateBody.ts`
- `functions/src/twilio/**`
- `functions/src/sendgrid/**`

**Frontend (the bishop + speaker entry points):**
- `src/app/routes/assign-speaker/**`
- `src/app/routes/assign-prayer/**`
- `src/app/routes/prepare-invitation/**`
- `src/app/routes/prepare-prayer-invitation/**`
- `src/app/routes/invite-speaker/**`
- `src/features/invitations/**`
- `src/lib/types/speakerInvitation.ts`
- `src/features/invitations/utils/invitationsCallable.ts`

**Firestore rules (the auth model the diagrams describe):**
- `firestore.rules` — only the `speakerInvitations`, participant
  status, and chat-related rules

If the user adds a brand-new file in any of those directories, treat
it as a trigger too (the surface area itself just grew).

## Decision: is the change doc-relevant?

Walk through these questions in order. Stop at the first **Yes**.

1. **Does it change a phase boundary?** New step (e.g. a reminder
   nudge), removed step, or reordered phase → update both diagrams.
2. **Does it change a delivery channel?** Adding/removing email, SMS,
   chat, or push fan-out → update both diagrams.
3. **Does it change the token lifecycle?** New token states, changed
   rotation cap, expiry policy shift → update Phase 3 in the sequence
   diagram + the "Captured" callout list.
4. **Does it change who gets notified?** Recipient list change for
   FCM pushes or receipt emails (e.g. clerks added, sender filtered
   differently) → update Phase 5 / 7.
5. **Does it rename or move a file in the source-files table?** →
   Update the table (and verify the relative link still resolves).
6. **Does it add a new Cloud Function in the eight-function surface?**
   → Update the sequence diagram + the "Cloud Functions" lane note.
7. **Does it change the speaker auth model or invite URL shape?** →
   Update Phase 3.

If none of the above apply, the change is **doc-irrelevant**. Don't
touch the doc — false-positive updates are noise. Examples of
doc-irrelevant changes:

- Internal refactor inside a function with no behavior change.
- Quiet-hours / template-variable tweaks (already in "simplified
  out").
- Speaker↔prayer template-key parity work (already in "simplified
  out").
- Component splits to stay under the 150-line cap.
- Test-only edits.
- Type-only edits that don't change runtime shape.

## How to update

1. Open `docs/invitation-flow.md`. The mermaid diagrams sit in
   ```` ```mermaid ```` fences — edit the source directly. Validate
   syntax mentally as you go (it's a small language).
2. If updating phases: keep the rectangle colors stable so phase
   numbering reads consistently. Don't introduce new lane names
   without adding the matching `participant` line at the top.
3. If updating the source-files table: keep the relative path format
   (`../functions/src/foo.ts`) so VS Code + GitHub both resolve the
   link.
4. **Render-check the change.** GitHub renders Mermaid natively —
   open the doc on the PR's "Files changed" tab and confirm both
   blocks still render. Or paste the changed diagram into
   <https://mermaid.live> for a quick syntax check.
5. **Land the doc update in the same PR as the code change.**
   Splitting it into a follow-up PR breaks the bisect story — anyone
   landing between the two PRs sees a stale doc. One PR, one commit,
   or two commits on the same branch.

## When in doubt

- If you're 70/30 on whether the change is doc-relevant, **ask the
  user once**: "This touches `<file>` — does the invitation flow doc
  need an update for this?" One-line confirmation, then act.
- If the change is large enough that the diagrams would need a real
  redesign (e.g. a new phase or a major rearchitecture), surface that
  to the user before editing. Don't try to redraw a sequence diagram
  silently.

## Guardrails

- Don't update the doc for purely cosmetic refactors. The doc
  describes behavior, not file structure.
- Don't reach into `docs/notifications.md`, `docs/features.md`, or
  `docs/domain.md` from this skill — they overlap thematically but
  aren't the invitation pipeline. If something belongs in those
  docs, surface it as a separate todo.
- Never auto-render PNGs and commit them. The Mermaid source is the
  source of truth; renders are a local convenience (and they bloat
  diffs).
