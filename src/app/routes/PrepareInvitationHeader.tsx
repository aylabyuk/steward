import { RemoveIcon } from "@/features/schedule/SpeakerInviteIcons";
import { PrepareInvitationActionBar } from "@/features/templates/PrepareInvitationActionBar";

interface Props {
  speakerName: string;
  email: string;
  hasEmail: boolean;
  busy: boolean;
  canSend: boolean;
  canSendReason: string | null;
  hasOverride: boolean;
  onCancel: () => void;
  onRevert: () => void;
  onMarkInvited: () => void;
  onPrint: () => void;
  onSend: () => void;
}

/** Sticky page header for the Prepare Invitation page: title block on
 *  the left, Cancel (X) on the right, centered toolbar below. */
export function PrepareInvitationHeader(props: Props) {
  return (
    <header className="sticky top-0 z-20 shrink-0 flex flex-col gap-3 border-b border-border bg-chalk px-4 sm:px-8 pt-4 sm:pt-5 pb-3 sm:pb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
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
        <button
          type="button"
          onClick={props.onCancel}
          aria-label="Cancel and close tab"
          title="Cancel"
          className="shrink-0 -mr-1 rounded-md p-2 text-walnut-3 hover:text-bordeaux hover:bg-parchment-2 focus:outline-none focus:ring-2 focus:ring-bordeaux/30"
        >
          <RemoveIcon />
        </button>
      </div>
      <div className="lg:hidden flex justify-center">
        <PrepareInvitationActionBar
          busy={props.busy}
          canSend={props.canSend}
          canSendReason={props.canSendReason}
          hasOverride={props.hasOverride}
          speakerName={props.speakerName}
          onRevert={props.onRevert}
          onMarkInvited={props.onMarkInvited}
          onPrint={props.onPrint}
          onSend={props.onSend}
        />
      </div>
    </header>
  );
}
