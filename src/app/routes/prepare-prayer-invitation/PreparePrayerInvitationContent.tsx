import { PrepareInvitationLetterTab } from "@/features/templates/PrepareInvitationLetterTab";
import { UnsavedLetterConfirm } from "@/features/templates/UnsavedLetterConfirm";
import { buildSavedVersionStamp } from "@/features/templates/utils/letterDates";
import type { LetterVars } from "@/features/templates/utils/prepareInvitationVars";
import { isValidEmail } from "@/lib/email";
import type { PrayerRole } from "@/lib/types";
import { PreparePrayerInvitationHeader } from "./PreparePrayerInvitationHeader";

interface FormState {
  busy: boolean;
  hydrated: boolean;
  dirty: boolean;
  letterHasOverride: boolean;
  initialJson: string | null;
  initialMarkdown: { bodyMarkdown: string; footerMarkdown: string };
  letterStateJson: string | null;
  letterBody: string;
  letterFooter: string;
  resetKey: number;
  error: string | null;
  savedAt: unknown;
  setLetterStateJson: (json: string) => void;
  captureInitial: (json: string) => void;
  clearLetterOverride: () => Promise<void>;
}

interface ActionState {
  save: () => Promise<void>;
  send: (email?: string) => void;
  sendSms: (phone?: string) => void;
}

interface ExitState {
  requestCancel: () => void;
  confirmOpen: boolean;
  busy: boolean;
  error: string | null;
  onKeepEditing: () => void;
  onDiscard: () => void;
  onSaveAndExit: () => Promise<void>;
}

interface Props {
  date: string;
  role: PrayerRole;
  prayerGiverName: string;
  prayerGiverEmail: string;
  prayerGiverPhone: string;
  vars: LetterVars;
  form: FormState;
  actions: ActionState;
  exit: ExitState;
}

/** Post-guard render shell for the prayer prepare page. Mirrors
 *  PrepareInvitationContent for the speaker side; both stay just
 *  separate enough that header / hook differences don't have to
 *  branch inside one component. */
export function PreparePrayerInvitationContent({
  date,
  role,
  prayerGiverName,
  prayerGiverEmail,
  prayerGiverPhone,
  vars,
  form,
  actions,
  exit,
}: Props) {
  const printVersionStamp = buildSavedVersionStamp(form.savedAt);
  return (
    <main className="min-h-dvh lg:h-dvh bg-parchment flex flex-col lg:overflow-hidden">
      <PreparePrayerInvitationHeader
        role={role}
        email={prayerGiverEmail}
        hasEmail={isValidEmail(prayerGiverEmail)}
        busy={form.busy}
        hasOverride={form.letterHasOverride}
        dirty={form.dirty}
        speakerName={prayerGiverName}
        speakerEmail={prayerGiverEmail}
        speakerPhone={prayerGiverPhone}
        assignedDate={date}
        onCancel={exit.requestCancel}
        onRevert={() => void form.clearLetterOverride()}
        onSave={() => void actions.save().catch(() => {})}
        onSend={actions.send}
        onSendSms={actions.sendSms}
      />
      <div className="flex-1 min-h-0 lg:overflow-hidden">
        {form.hydrated ? (
          <PrepareInvitationLetterTab
            initialJson={form.initialJson}
            initialMarkdown={form.initialMarkdown}
            liveStateJson={form.letterStateJson}
            body={form.letterBody}
            footer={form.letterFooter}
            onChange={form.setLetterStateJson}
            onInitial={form.captureInitial}
            resetKey={form.resetKey}
            vars={vars}
            {...(printVersionStamp ? { printVersionStamp } : {})}
          />
        ) : (
          <p className="px-5 sm:px-8 pt-5 pb-4 font-serif italic text-[14px] text-walnut-3">
            Loading letter…
          </p>
        )}
        {form.error && (
          <p className="px-5 sm:px-8 mt-4 font-sans text-[12.5px] text-bordeaux">{form.error}</p>
        )}
      </div>
      <UnsavedLetterConfirm
        open={exit.confirmOpen}
        busy={exit.busy}
        error={exit.error}
        onKeepEditing={exit.onKeepEditing}
        onDiscard={exit.onDiscard}
        onSaveAndExit={() => void exit.onSaveAndExit()}
      />
    </main>
  );
}
