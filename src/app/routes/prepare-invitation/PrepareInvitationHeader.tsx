import { HeaderCloseButton } from "@/components/ui/HeaderCloseButton";
import { PrepareInvitationActionBar } from "@/features/templates/PrepareInvitationActionBar";

interface Props {
  speakerName: string;
  speakerEmail: string;
  speakerPhone: string;
  email: string;
  hasEmail: boolean;
  busy: boolean;
  hasOverride: boolean;
  /** Meeting date (ISO YYYY-MM-DD) — threaded to the action bar's
   *  share path so the generated PDF filename includes it. */
  assignedDate: string;
  onCancel: () => void;
  onRevert: () => void;
  onSend: (email: string) => void;
  onSendSms: (phone: string) => void;
}

/** Sticky page header for the Prepare Invitation page. Hosts the
 *  title block, Cancel (X), and the action bar at every breakpoint —
 *  on desktop the bar sits flush right next to the title; on mobile
 *  it stacks below. iOS pattern parity: a clearly labeled
 *  "Send Invitation" primary CTA is always above-the-fold. */
export function PrepareInvitationHeader(props: Props) {
  return (
    <header className="sticky top-0 z-20 shrink-0 flex flex-col gap-3 lg:gap-0 border-b border-border bg-chalk px-4 sm:px-8 pt-4 sm:pt-5 pb-3 sm:pb-4">
      <div className="flex items-start justify-between gap-3 lg:gap-6">
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass-deep">
            Prepare invitation
          </div>
          <h1 className="font-display text-[20px] sm:text-[22px] font-semibold text-walnut leading-tight truncate">
            {props.speakerName}
          </h1>
          <p className="font-serif italic text-[12.5px] text-walnut-3 truncate">
            {props.hasEmail ? `Will be emailed to ${props.email}.` : "No email on file."}
          </p>
        </div>
        <div className="hidden lg:block shrink-0">
          <PrepareInvitationActionBar
            busy={props.busy}
            hasOverride={props.hasOverride}
            speakerName={props.speakerName}
            speakerEmail={props.speakerEmail}
            speakerPhone={props.speakerPhone}
            assignedDate={props.assignedDate}
            onRevert={props.onRevert}
            onSend={props.onSend}
            onSendSms={props.onSendSms}
          />
        </div>
        <HeaderCloseButton
          onClick={props.onCancel}
          label="Cancel"
          ariaLabel="Cancel and return to schedule"
        />
      </div>
      <div className="lg:hidden flex justify-center">
        <PrepareInvitationActionBar
          busy={props.busy}
          hasOverride={props.hasOverride}
          speakerName={props.speakerName}
          speakerEmail={props.speakerEmail}
          speakerPhone={props.speakerPhone}
          assignedDate={props.assignedDate}
          onRevert={props.onRevert}
          onSend={props.onSend}
          onSendSms={props.onSendSms}
        />
      </div>
    </header>
  );
}
