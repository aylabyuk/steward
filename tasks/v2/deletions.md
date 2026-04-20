# v2 Deletions

## Routes
- `/week/:date/speaker/:id/letter`
- `/print/:date/conducting`
- `/print/:date/congregation`
- `/settings/letter-templates`

## Source files
- `src/features/print/` (whole folder: ConductingView, CongregationView, PrintGate, PrintToolbar, printFormat.ts)
- `src/features/speakers/LetterComposer.tsx`
- `src/features/speakers/LetterTemplateEditor.tsx`
- `src/features/speakers/SendActions.tsx`
- `src/features/speakers/renderTemplate.ts` (+ test)
- `src/features/speakers/templateValues.ts`
- `src/app/routes/print-conducting.tsx`
- `src/app/routes/print-congregation.tsx`
- `src/app/routes/speaker-letter.tsx`
- `src/app/routes/letter-templates.tsx`
- `src/hooks/useLetterTemplates.ts`
- `src/hooks/useSpeaker.ts`

## Test files
- `tests/rules/letterTemplates.test.ts`

## Schedule-page specific (replaced by new components)
- `src/features/schedule/MeetingCard.tsx`
- `src/features/speakers/SpeakerSection.tsx`

## Keep (reused by v2)
- `src/features/speakers/buildMailto.ts` (+ test) — powers inline "Send email"
- `src/features/speakers/computeCc.ts` (+ test)
- `src/features/speakers/leadTime.ts` (+ test) — short-notice callout
- `src/features/speakers/SpeakerForm.tsx` — stays for `/week/:date` (deferred redesign)
- `src/features/speakers/speakerActions.ts` — simplified (letter CRUD removed)
