import { CheckIcon, PrintIcon, RemoveIcon, SendIcon } from "@/features/schedule/SpeakerInviteIcons";

interface Props {
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

/** Top-of-page action toolbar for the Prepare Invitation page.
 *  Icon-only buttons in a connected group — tight on space, labels
 *  travel in `title` (tooltip on desktop hover) and `aria-label` (for
 *  screen readers + mobile assistive tech). On mobile the whole group
 *  centers below the title block; on desktop it right-aligns. */
export function PrepareInvitationActionBar({
  busy,
  canSend,
  canSendReason,
  hasOverride,
  onCancel,
  onRevert,
  onMarkInvited,
  onPrint,
  onSend,
}: Props) {
  return (
    <div className="w-full lg:w-auto flex flex-col items-center lg:items-end gap-1">
      <div className="inline-flex isolate rounded-md shadow-[0_1px_0_rgba(35,24,21,0.08)]">
        <GroupBtn position="first" label="Cancel" onClick={onCancel} disabled={busy}>
          <RemoveIcon />
        </GroupBtn>
        <GroupBtn
          position="mid"
          label={hasOverride ? "Clear per-speaker override" : "Revert to ward default"}
          indicator={hasOverride}
          onClick={onRevert}
          disabled={busy}
        >
          <RevertIcon />
        </GroupBtn>
        <GroupBtn position="mid" label="Mark invited only" onClick={onMarkInvited} disabled={busy}>
          <CheckIcon />
        </GroupBtn>
        <GroupBtn position="mid" label="Print letter" onClick={onPrint} disabled={busy}>
          <PrintIcon />
        </GroupBtn>
        <GroupBtn
          position="last"
          label="Send email"
          onClick={onSend}
          disabled={busy || !canSend}
          primary
        >
          <SendIcon />
        </GroupBtn>
      </div>
      {canSendReason && (
        <span className="font-serif italic text-[11px] sm:text-[11.5px] text-walnut-3">
          {canSendReason}
        </span>
      )}
    </div>
  );
}

interface GroupBtnProps {
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  /** Small walnut dot tucked under the icon to signal "this speaker
   *  currently has an override that Revert will clear". */
  indicator?: boolean;
  position: "first" | "mid" | "last";
  label: string;
  children: React.ReactNode;
}

function GroupBtn({
  onClick,
  disabled,
  primary,
  indicator,
  position,
  label,
  children,
}: GroupBtnProps) {
  const rounded = position === "first" ? "rounded-l-md" : position === "last" ? "rounded-r-md" : "";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={[
        "relative inline-flex items-center justify-center px-3 py-2 sm:px-3.5 sm:py-2.5",
        "border transition-colors focus:outline-none focus:z-10 focus:ring-2 focus:ring-bordeaux/30",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        rounded,
        position !== "first" && "-ml-px",
        primary
          ? "bg-bordeaux text-chalk border-bordeaux-deep hover:bg-bordeaux-deep disabled:hover:bg-bordeaux"
          : "bg-chalk text-walnut border-border-strong hover:bg-parchment-2 disabled:hover:bg-chalk",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
      {indicator && (
        <span aria-hidden className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-bordeaux" />
      )}
    </button>
  );
}

function RevertIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 7v6h6" />
      <path d="M3 13a9 9 0 1 0 3-7.7L3 9" />
    </svg>
  );
}
