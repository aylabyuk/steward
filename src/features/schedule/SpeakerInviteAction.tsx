import { cn } from "@/lib/cn";
import { isValidEmail } from "@/lib/email";
import type { Draft } from "./speakerDraft";
import { CheckIcon, MailIcon, PrintIcon, SendIcon } from "./SpeakerInviteIcons";

interface Props {
  draft: Draft;
  date: string;
  onMarkInvited: () => void;
  onPrint: () => void;
}

export function InviteAction({ draft, date, onMarkInvited, onPrint }: Props) {
  const email = draft.email.trim();
  const hasEmail = email.length > 0;
  const emailValid = isValidEmail(email);
  const invited = draft.status === "invited" || draft.status === "confirmed";

  function handleSendEmail() {
    if (!emailValid) return;
    const subject = encodeURIComponent(`Speaker invitation — ${date}`);
    const body = encodeURIComponent(
      `Dear ${draft.name},\n\nThe bishopric invites you to speak in sacrament meeting on ${date}.\n\nTopic: ${draft.topic || "(To be determined)"}\nDuration: 10–15 minutes\n\nPlease let us know if this works.\n\nThank you!`,
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    onMarkInvited();
  }

  return (
    <div className="bg-parchment-2 border border-border rounded-lg px-3 py-2.5 mb-3 flex items-center flex-wrap gap-y-2.5 gap-x-3.5">
      <div className="flex items-center gap-2 text-[13px] text-walnut-2 min-w-0 flex-1 basis-50 font-serif italic">
        {!hasEmail && (
          <span>No email on file — deliver a printed letter or reach out directly.</span>
        )}
        {hasEmail && emailValid && (
          <>
            <MailIcon />
            <span className="truncate">
              Send invitation to{" "}
              <strong className="font-semibold not-italic text-bordeaux font-sans">{email}</strong>
            </span>
          </>
        )}
        {hasEmail && !emailValid && (
          <span className="text-bordeaux">
            Invalid email format — fix the address or deliver a printed letter.
          </span>
        )}
      </div>
      <div className="inline-flex gap-1.5 shrink-0 flex-wrap ml-auto">
        <Btn onClick={onMarkInvited} icon={invited ? <CheckIcon /> : null}>
          Mark invited
        </Btn>
        <Btn onClick={onPrint} icon={<PrintIcon />} primary={!emailValid}>
          Print letter
        </Btn>
        {hasEmail && (
          <Btn onClick={handleSendEmail} icon={<SendIcon />} primary disabled={!emailValid}>
            Send email
          </Btn>
        )}
      </div>
    </div>
  );
}

function Btn({
  onClick,
  icon,
  primary,
  disabled,
  children,
}: {
  onClick: () => void;
  icon?: React.ReactNode;
  primary?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "font-sans text-[12.5px] font-semibold px-3 py-1.5 rounded-md border inline-flex items-center gap-1.5 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed",
        primary
          ? "bg-bordeaux text-parchment border-bordeaux-deep hover:bg-bordeaux-deep shadow-[0_1px_0_rgba(35,24,21,0.18)] disabled:hover:bg-bordeaux"
          : "bg-chalk text-walnut border-border-strong hover:bg-parchment-2 disabled:hover:bg-chalk",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
