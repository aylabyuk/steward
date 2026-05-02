# Speaker / Prayer Invitation Flow

This doc traces the end-to-end flow for inviting a speaker or prayer to a sacrament meeting — from the moment a bishopric member adds them to a meeting, through delivery (email + SMS + web chat), the speaker's response, and the receipts that fan back to the bishopric.

It holds two diagrams at different altitudes:

- **[Bishopric flow](#bishopric-flow)** — high-level, suitable for sharing with the bishopric.
- **[Engineering sequence](#engineering-sequence)** — full lanes (Cloud Functions, Twilio, SendGrid, Firestore, FCM) for contributors and review.

Speaker invitations and prayer invitations follow the *same* flow — the same Cloud Functions, the same capability-token model, the same Twilio Conversation. The only differences are template keys (`speakerLetter` vs `prayerLetter`, etc.) and a handful of UI strings.

---

## Bishopric flow

```mermaid
flowchart TD
    A[Bishop opens<br/>Schedule view] --> B[Adds speaker or prayer<br/>to a meeting]
    B --> C[Captures name,<br/>phone, email, topic]
    C --> D[Opens 'Prepare invitation'<br/>page — customizes letter]
    D --> E{Send via?}
    E -->|Email| F[Speaker gets email<br/>with invite link]
    E -->|SMS| G[Speaker gets SMS<br/>with invite link]
    E -->|Both| F & G

    F --> H[Speaker taps link →<br/>opens invite page]
    G --> H
    H --> I[Reads the letter,<br/>can chat with bishopric]
    I --> J{Accept or decline?}
    J -->|Accepts| K[Speaker taps Yes<br/>+ optional note]
    J -->|Declines| L[Speaker taps No<br/>+ optional reason]
    J -->|Replies via SMS<br/>or chat instead| M[Conversation<br/>continues in chat]

    K --> N[Bishopric gets push notification<br/>+ confirmation email]
    L --> N
    M --> O[Bishopric sees the message<br/>in the chat thread + push]

    N --> P[Bishop opens response<br/>in the app]
    P --> Q[Taps 'Apply response'<br/>→ speaker status updates<br/>to Confirmed / Declined]
    Q --> R[Speaker gets receipt email<br/>confirming Yes/No on file]
```

### Walkthrough

1. **Assign.** From the Schedule view a bishop adds a speaker or prayer participant to a Sunday meeting and captures their contact info (and topic, for speakers).
2. **Prepare.** The bishop opens a "Prepare invitation" page that loads the ward's letter template into a WYSIWYG editor. The bishop can tweak the letter for this specific person before sending.
3. **Send.** The bishop chooses Email, SMS, or both. The speaker receives a personalized message with a one-tap invite link.
4. **Speaker reads + chats.** The link opens a public web page showing the letter. The speaker can chat back-and-forth with the bishopric directly on the page, or reply by SMS — both feed the same thread.
5. **Speaker responds.** The speaker either taps Yes/No on the page (with an optional note) or just sends a reply by SMS / chat. Either way the bishopric is notified.
6. **Apply.** The bishop opens the response in the app and taps "Apply" to lock the participant's status to Confirmed or Declined. The speaker gets a receipt email confirming what's on file.

---

## Engineering sequence

```mermaid
sequenceDiagram
    autonumber
    participant Bishop as Bishop (web app)
    participant Fn as Cloud Functions
    participant FS as Firestore
    participant Twilio
    participant SG as SendGrid
    participant SpkPhone as Speaker (SMS)
    participant SpkEmail as Speaker (email)
    participant SpkWeb as Speaker (invite page)
    participant FCM as FCM (bishopric push)

    rect rgb(240,248,255)
    Note over Bishop,FS: Phase 1 — Assign + Prepare
    Bishop->>FS: Create / update speaker or prayer participant
    Bishop->>FS: Read letter template (speakerLetter / prayerLetter)
    Bishop->>Bishop: Edit letter (Lexical WYSIWYG)
    end

    rect rgb(245,255,245)
    Note over Bishop,SG: Phase 2 — Send invitation
    Bishop->>Fn: sendSpeakerInvitation { mode: "fresh", channels }
    Fn->>Twilio: Create Conversation, add bishopric + speaker chat-identity
    Note right of Twilio: Speaker is added as chat-identity ONLY<br/>(speaker:{id}). No SMS-only participant —<br/>inbound SMS is relayed server-side instead<br/>(see Phase 4). Avoids Twilio's chat→SMS<br/>auto-broadcast echo and duplicate bishop-<br/>reply SMS. (#227)
    Fn->>Fn: Generate token, hash it (SHA-256)
    Fn->>FS: Atomic batch — public parent + private auth subdoc:<br/>parent  speakerInvitations/{id} ← letter snapshot, conversationSid, expiresAt<br/>subdoc  …/{id}/private/auth ← tokenHash, contact PII, bishopric, deliveryRecord, fromNumberMode
    Note right of FS: Doc split for security audit C1.<br/>Public parent is world-readable so the<br/>landing page can render without auth.<br/>Private subdoc is gated by Firestore rules<br/>(speaker custom-claim or active bishopric).
    Fn->>FS: Stamp participant: status="invited"
    par Email channel
        Fn->>SG: Send invitation email (template + invite URL)
        SG->>SpkEmail: Inbox: invitation email
    and SMS channel
        Fn->>Twilio: SMS to speaker phone (template + invite URL)
        Twilio->>SpkPhone: SMS: invitation
    end
    Fn-->>Bishop: deliveryRecord { email: sent, sms: sent }
    end

    rect rgb(255,250,240)
    Note over SpkWeb,Twilio: Phase 3 — Speaker opens link
    SpkPhone->>SpkWeb: Tap invite URL
    SpkEmail->>SpkWeb: Tap invite URL
    SpkWeb->>FS: Public read: invitation doc (letter snapshot)
    SpkWeb->>SpkWeb: Render letter
    SpkWeb->>Fn: issueSpeakerSession { invitationToken }
    Fn->>FS: TX: hash token, compare, flip "consumed"
    alt token active
        Fn-->>SpkWeb: Firebase custom token + Twilio chat JWT
    else token consumed/expired
        Fn->>Fn: Rotate token (cap 3/day)
        Fn->>Twilio: Re-send SMS w/ fresh URL
        Fn-->>SpkWeb: { status: "rotated", phoneLast4 }
    end
    end

    rect rgb(255,245,245)
    Note over SpkWeb,FCM: Phase 4 — Speaker responds
    alt Yes / No on web page
        SpkWeb->>FS: Write response { answer, reason, respondedAt }
        SpkWeb->>Twilio: Conversation message (speaker:{id})
        Twilio->>Fn: onTwilioWebhook (onMessageAdded)
        Fn->>FCM: Push to bishopric
    else SMS reply
        SpkPhone->>Twilio: Reply SMS
        Twilio->>Fn: onTwilioWebhook (Programmable Messaging inbound)
        Fn->>FS: Lookup active invitation by speakerPhone
        Fn->>Twilio: postMessage as speaker:{id} into the conversation
        Twilio->>Fn: onTwilioWebhook (onMessageAdded — same fn, second hit)
        Fn->>FCM: Push to bishopric
        Note right of Fn: Single endpoint dispatches on payload<br/>shape — Programmable Messaging inbound<br/>(MessageSid + From) vs Conversations<br/>onMessageAdded (EventType). See<br/>twilio/inboundSmsRelay.ts.
    else Web chat message (free-form)
        SpkWeb->>Twilio: Conversation message
        Twilio->>Fn: onTwilioWebhook
        Fn->>FCM: Push to bishopric
    end
    end

    rect rgb(248,240,255)
    Note over FS,SG: Phase 5 — Receipt + notify (Yes/No path)
    FS->>Fn: onInvitationWrite (response set)
    par Speaker email
        Fn->>SG: Speaker receipt email (Yes/No template, CC bishopric)
        SG->>SpkEmail: Receipt: "We have your Yes/No on file"
    and Speaker SMS
        Fn->>Twilio: sendSmsDirect (speakerResponse{Accepted,Declined}Sms template)
        Twilio->>SpkPhone: Receipt SMS: "we've recorded your response"
    and Bishopric notify
        Fn->>FCM: Push: "{name} accepted/declined"
        FCM->>Bishop: Notification
    end
    end

    rect rgb(240,255,255)
    Note over Bishop,FS: Phase 6 — Apply response
    Bishop->>FS: applyResponseToSpeaker { acknowledgedAt, bishopUid }
    FS->>FS: Participant status → "confirmed" or "declined"
    FS->>Fn: onInvitationWrite (acknowledgedAt set)
    Fn->>SG: Bishopric receipt email (per-member)
    end

    rect rgb(255,255,235)
    Note over Bishop,SpkPhone: Phase 7 — Bishop replies in chat (later)
    Bishop->>Twilio: Conversation message
    Twilio->>Fn: onTwilioWebhook (uid:{bishopUid})
    par Notify speaker via SMS
        Fn->>Fn: Check speaker heartbeat (online?)
        alt offline (>120s)
            Fn->>Fn: Rotate token (no daily cap)
            Fn->>Twilio: sendSmsDirect w/ fresh invite URL
            Twilio->>SpkPhone: SMS: bishop replied
        else online
            Note over Fn: Skip SMS — speaker is reading chat live
        end
        Note right of Fn: Server-driven via smsSpeaker — there's no<br/>SMS-only Conversations participant for the<br/>speaker, so Twilio's auto-broadcast doesn't<br/>fire. Single SMS, no duplicate. (#227)
    and Notify speaker via email
        Fn->>SG: Email: bishop replied
        SG->>SpkEmail: Inbox
    and Notify other bishopric
        Fn->>FCM: Push to other active bishopric
    end
    end
```

---

## Source files by phase

| Phase | File |
|------|------|
| Bishop assigns speaker | [src/app/routes/assign-speaker/AssignSpeakerPage.tsx](../src/app/routes/assign-speaker/AssignSpeakerPage.tsx) |
| Bishop assigns prayer | [src/app/routes/assign-prayer/AssignPrayerPage.tsx](../src/app/routes/assign-prayer/AssignPrayerPage.tsx) |
| Bishop prepares letter (speaker) | [src/app/routes/prepare-invitation/PrepareInvitationPage.tsx](../src/app/routes/prepare-invitation/PrepareInvitationPage.tsx) |
| Bishop prepares letter (prayer) | [src/app/routes/prepare-prayer-invitation/PreparePrayerInvitationPage.tsx](../src/app/routes/prepare-prayer-invitation/PreparePrayerInvitationPage.tsx) |
| Send invitation (callable) | [functions/src/sendSpeakerInvitation.ts](../functions/src/sendSpeakerInvitation.ts) → [functions/src/freshInvitation.ts](../functions/src/freshInvitation.ts) |
| Email + SMS delivery | [functions/src/invitationDelivery.ts](../functions/src/invitationDelivery.ts) |
| Speaker invite page | [src/app/routes/invite-speaker/SpeakerInvitationLandingPage.tsx](../src/app/routes/invite-speaker/SpeakerInvitationLandingPage.tsx) |
| Token exchange | [functions/src/issueSpeakerSession.ts](../functions/src/issueSpeakerSession.ts) |
| Speaker writes Yes/No, bishop applies | [src/features/invitations/utils/invitationActions.ts](../src/features/invitations/utils/invitationActions.ts) |
| Receipt emails + response push | [functions/src/onInvitationWrite.ts](../functions/src/onInvitationWrite.ts), [functions/src/invitationResponseNotify.ts](../functions/src/invitationResponseNotify.ts) |
| Twilio reply webhook (Conversations + Messaging) | [functions/src/onTwilioWebhook.ts](../functions/src/onTwilioWebhook.ts) |
| Inbound SMS → chat relay | [functions/src/twilio/inboundSmsRelay.ts](../functions/src/twilio/inboundSmsRelay.ts) |
| Doc-split helpers (parent + auth subdoc reads/writes) | [functions/src/invitationDocs.ts](../functions/src/invitationDocs.ts) |
| Migration: fold private fields off existing parents | [scripts/migrate-invitation-doc-split.ts](../scripts/migrate-invitation-doc-split.ts) |

---

## Storage shape — public parent vs private auth subdoc

Two Firestore docs back every invitation, written atomically at send
time. The public parent stays world-readable so the speaker landing
page renders without auth; the private subdoc is gated by Firestore
rules.

**Public parent** at `wards/{wardId}/speakerInvitations/{id}` — letter
snapshot fields (`speakerName`, `assignedDate`, `wardName`,
`inviterName`, `bodyMarkdown`, `footerMarkdown`, `editorStateJson`,
`speakerTopic`, `kind`, `prayerRole`, `speakerRef`), `expiresAt`,
`createdAt`, `conversationSid`, `currentSpeakerStatus`, plus a tiny
`responseSummary` (`answer` + `respondedAt`) so the pre-auth banner
can switch out of "tap Yes/No" mode without reading the private
subdoc.

**Private auth subdoc** at `wards/{wardId}/speakerInvitations/{id}/private/auth` —
sensitive state: `tokenHash`, `tokenStatus`, `tokenExpiresAt`,
`tokenRotationsByDay`, `speakerEmail`, `speakerPhone`,
`bishopricParticipants` (with email), the full `response` object
(`reason`, `actorUid`, `actorEmail`, `acknowledgedAt`,
`acknowledgedBy`), `speakerLastSeenAt`, `fromNumberMode`,
`deliveryRecord`. Read-allowed for the speaker only after
`issueSpeakerSession` mints a Firebase custom token with matching
`invitationId` + `wardId` claims, OR for an active bishopric/clerk.
Update is even tighter — see [firestore.rules](../firestore.rules).

The merged `SpeakerInvitation` shape callers consume is built by
loading both halves: server callers go through `invitationDocs.ts`'
`loadMergedInvitation` / `loadMergedInvitationByConversation`; client
hooks (`useSpeakerInvitation`, `useLatestInvitation`) subscribe to
both and merge in component state. Closes the C1 finding from the
2026-05-01 security audit.

---

## Intentionally simplified out

The diagrams omit a few branches that exist in the code but would clutter the picture. Pointers for when you need them:

- **Quiet hours / timezone filtering on FCM pushes** — applied per-recipient inside `notifyBishopricOfResponse` and the reply-push helpers.
- **Per-template variable interpolation** (`{{speakerName}}`, `{{topic}}`, `{{wardName}}`, …) — handled by `messageTemplates.ts` in `functions/src/`.
- **Speaker vs prayer template keys** — every notification lookup branches on `kind` to pick the right template (e.g. `speakerResponseAccepted` vs `prayerResponseAccepted`). Parity was finished in commit `8660a98`.
- **Twilio Conversation cleanup on re-send** — `freshInvitation.ts` deletes any prior Conversation for the same (ward, speaker, meeting) before creating a new one.
- **Why the speaker has no SMS-only Conversations participant** — Twilio's chat → SMS auto-broadcast would echo the speaker's web-side replies back to their own phone, and double-up on bishop chat replies (since `smsSpeaker` already drives outbound server-side). The relay model avoids both. The proper Twilio fix (`MessagingBinding.ProjectedAddress`) is gated by account authorization (error 50439); revisit if/when granted. See #227.
- **Token rate-limit response** — when a speaker burns through the 3/day rotation cap, `issueSpeakerSession` returns `{ status: "rate-limited" }` and the invite page tells them to contact the bishopric.
- **iOS WebView `mintWebSession` branch** — `issueSpeakerSession` mints an extra session shape when called with `mintWebSession: true` from the iOS app.
