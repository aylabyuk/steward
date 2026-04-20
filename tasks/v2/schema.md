# v2 Firestore schema

## `MeetingType` — 4 values (was 6)
```ts
export const MEETING_TYPES = ["regular", "fast", "stake", "general"] as const;
```
Dropped: `ward_conference`, `other`.
Renamed: `fast_sunday → fast`, `stake_conference → stake`,
`general_conference → general`.

## `SpeakerStatus` — new dedicated enum
```ts
export const SPEAKER_STATUSES = ["planned", "invited", "confirmed", "declined"] as const;
export const speakerStatusSchema = z.enum(SPEAKER_STATUSES);
```
`speakerSchema.status` references this enum (was `assignmentSchema.shape.status`).

## Speaker schema
**Add:** `role: "Member" | "Youth" | "High Council" | "Visiting"` (required;
default `"Member"` at create).

**Remove:** `letterBody`, `letterUpdatedAt`, `sentAt`, `sentBy`.

**Keep:** `name`, `email`, `topic`, `status`, `role`, `createdAt`, `updatedAt`.

## `letterTemplates` collection
Removed entirely. Delete the `match /letterTemplates` block in
`firestore.rules`.

## `AssignmentStatus`
Unchanged — 8 values still used by prayers, music, sacrament on
`/week/:date`.

## Rules impact
None on status changes (rules only gate `meeting.status`). Remove the
`letterTemplates` rules block + its test.

## Migration
None. Phase 14.4 not shipped → no prod data. Single-PR rename sweep.

## `readiness.ts` logic after rename
- **regular** — full check (speakers + 3 hymns + prayers + pianist + chorister + sacrament bread + 2 blessers)
- **fast** — hymns + prayers + pianist + chorister + sacrament (skip speakers)
- **stake**, **general** — empty missing list

## Caller files to sweep (enum-literal renames)
- `src/features/meetings/readiness.ts` (+ test)
- `src/features/meetings/ensureMeetingDoc.ts` (+ test)
- `src/features/meetings/meetingLabels.ts`
- `src/features/meetings/historyFormat.ts` (+ test)
- `src/features/meetings/contentHash.ts` (+ test) — drop `letterBody` from hash input
- `src/features/meetings/copyFromPrevious.test.ts`
- `src/features/speakers/speakerActions.ts` — drop letter CRUD
- `src/features/settings/NonMeetingSundaysEditor.tsx`
- `src/features/meetings/sections/HymnsSection.tsx`
- `src/features/meetings/WeekEditor.tsx`
- `functions/src/meetingChange.ts` (+ test)
- `functions/src/nudgeTarget.ts` (+ test)
- `scripts/bootstrap-ward.ts` — drop letter-templates seed
- `src/lib/types/types.test.ts` — fixture updates
