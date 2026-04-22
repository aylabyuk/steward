import { useMemo, useState } from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { useWardSettings } from "@/hooks/useWardSettings";
import { isValidEmail } from "@/lib/email";
import { PrepareInvitationActionBar } from "./PrepareInvitationActionBar";
import { PrepareInvitationEmailTab } from "./PrepareInvitationEmailTab";
import { PrepareInvitationLetterTab } from "./PrepareInvitationLetterTab";
import { PrepareInvitationTabs, type PrepareInvitationTab } from "./PrepareInvitationTabs";
import { formatAssignedDate, formatToday } from "./letterDates";
import { useSpeakerEmailTemplate } from "./useSpeakerEmailTemplate";
import { useSpeakerLetterTemplate } from "./useSpeakerLetterTemplate";
import { usePrepareInvitation } from "./usePrepareInvitation";
import { usePrepareInvitationActions } from "./usePrepareInvitationActions";

interface Props {
  wardId: string;
  date: string;
  speakerId: string;
  speakerName: string;
  speakerEmail: string;
  speakerTopic: string;
  inviterName: string;
  open: boolean;
  onClose: () => void;
  onMarkInvited: () => void;
  onPrint: () => void;
}

const PLACEHOLDER_URL = "https://example.com/invite/speaker/your-ward/sample-token";

export function PrepareInvitationDialog(props: Props) {
  const { wardId, date, speakerId, speakerName, speakerEmail, speakerTopic, inviterName } = props;
  const { open, onClose, onMarkInvited, onPrint } = props;
  const [tab, setTab] = useState<PrepareInvitationTab>("letter");
  const [saveAsOverride, setSaveAsOverride] = useState(false);
  const ward = useWardSettings();
  const { data: letterTemplate } = useSpeakerLetterTemplate();
  const { data: emailTemplate } = useSpeakerEmailTemplate();
  const form = usePrepareInvitation({
    wardId,
    date,
    speakerId,
    open,
    letterTemplate,
    emailTemplate,
  });
  useLockBodyScroll(open);

  const wardName = ward.data?.name ?? "";
  const vars = useMemo(
    () => ({
      speakerName,
      topic: speakerTopic.trim() || "a topic of your choosing",
      date: formatAssignedDate(date),
      today: formatToday(),
      wardName,
      inviterName,
    }),
    [speakerName, speakerTopic, date, wardName, inviterName],
  );
  const previewEmailVars = useMemo(() => ({ ...vars, inviteUrl: PLACEHOLDER_URL }), [vars]);

  const actions = usePrepareInvitationActions({
    wardId,
    date,
    speakerId,
    speakerName,
    speakerEmail,
    speakerTopic,
    inviterName,
    vars,
    saveAsOverride,
    form,
    onClose,
    onMarkInvited,
    onPrint,
  });

  const email = speakerEmail.trim();
  const hasEmail = email.length > 0;
  const emailValid = isValidEmail(email);
  const canSend = hasEmail && emailValid;
  const canSendReason = !hasEmail
    ? "No email on file — print or mark invited instead."
    : !emailValid
      ? "Invalid email format."
      : null;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Prepare invitation for ${speakerName}`}
    >
      <div className="w-full h-full max-w-350 max-h-[96vh] flex flex-col rounded-[14px] border border-border-strong bg-chalk shadow-elev-3">
        <header className="shrink-0 flex items-start justify-between gap-4 flex-wrap border-b border-border px-5 sm:px-6 pt-5 pb-4">
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass-deep">
              Prepare invitation
            </div>
            <h2 className="font-display text-[20px] font-semibold text-walnut leading-tight truncate">
              {speakerName}
            </h2>
            <p className="font-serif italic text-[13px] text-walnut-3 truncate">
              {hasEmail ? `Will be emailed to ${email}.` : "No email on file."}
            </p>
          </div>
          <PrepareInvitationActionBar
            saveAsOverride={saveAsOverride}
            setSaveAsOverride={setSaveAsOverride}
            busy={form.busy}
            canSend={canSend}
            canSendReason={canSendReason}
            onCancel={onClose}
            onMarkInvited={actions.markInvited}
            onPrint={actions.print}
            onSend={actions.send}
          />
        </header>

        <div className="flex-1 overflow-auto px-5 sm:px-6 pt-4 pb-5 sm:pb-6">
          <PrepareInvitationTabs active={tab} onChange={setTab} />

          {tab === "letter" ? (
            <PrepareInvitationLetterTab
              body={form.letterBody}
              footer={form.letterFooter}
              setBody={form.setLetterBody}
              setFooter={form.setLetterFooter}
              hasOverride={form.letterHasOverride}
              disabled={form.busy}
              vars={vars}
              onRevertToDefault={form.revertLetterToWardDefault}
              onClearOverride={() => void form.clearLetterOverride()}
            />
          ) : (
            <PrepareInvitationEmailTab
              body={form.emailBody}
              setBody={form.setEmailBody}
              hasOverride={form.emailHasOverride}
              disabled={form.busy}
              vars={previewEmailVars}
              onRevertToDefault={form.revertEmailToWardDefault}
              onClearOverride={() => void form.clearEmailOverride()}
            />
          )}

          {form.error && <p className="mt-4 font-sans text-[12.5px] text-bordeaux">{form.error}</p>}
        </div>
      </div>
    </div>
  );
}
