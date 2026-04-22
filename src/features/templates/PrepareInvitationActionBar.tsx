interface Props {
  saveAsOverride: boolean;
  setSaveAsOverride: (v: boolean) => void;
  busy: boolean;
  canSend: boolean; // email is present + valid + speaker persisted
  canSendReason: string | null; // inline hint when !canSend
  onCancel: () => void;
  onMarkInvited: () => void;
  onPrint: () => void;
  onSend: () => void;
}

/** Top-of-page action bar for PrepareInvitationDialog/Page. Four
 *  terminal actions rendered as a connected button group so they take
 *  less horizontal room than individual buttons with gaps — important
 *  on mobile where the header wraps tightly. */
export function PrepareInvitationActionBar({
  saveAsOverride,
  setSaveAsOverride,
  busy,
  canSend,
  canSendReason,
  onCancel,
  onMarkInvited,
  onPrint,
  onSend,
}: Props) {
  return (
    <div className="flex flex-col gap-1.5 items-end">
      <label className="flex items-center gap-2 font-sans text-[11px] sm:text-[12px] text-walnut-2 select-none">
        <input
          type="checkbox"
          checked={saveAsOverride}
          onChange={(e) => setSaveAsOverride(e.target.checked)}
          disabled={busy}
          className="accent-bordeaux"
        />
        <span className="hidden sm:inline">Save as per-speaker override</span>
        <span className="sm:hidden">Save as override</span>
      </label>
      <div className="inline-flex isolate rounded-md shadow-[0_1px_0_rgba(35,24,21,0.08)]">
        <GroupBtn onClick={onCancel} disabled={busy} position="first">
          Cancel
        </GroupBtn>
        <GroupBtn onClick={onMarkInvited} disabled={busy} position="mid">
          <span className="hidden sm:inline">Mark invited only</span>
          <span className="sm:hidden">Mark invited</span>
        </GroupBtn>
        <GroupBtn onClick={onPrint} disabled={busy} position="mid">
          <span className="hidden sm:inline">Print letter</span>
          <span className="sm:hidden">Print</span>
        </GroupBtn>
        <GroupBtn onClick={onSend} disabled={busy || !canSend} position="last" primary>
          {busy ? (
            "…"
          ) : (
            <>
              <span className="hidden sm:inline">Send email</span>
              <span className="sm:hidden">Send</span>
            </>
          )}
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
  position: "first" | "mid" | "last";
  children: React.ReactNode;
}

function GroupBtn({ onClick, disabled, primary, position, children }: GroupBtnProps) {
  const rounded = position === "first" ? "rounded-l-md" : position === "last" ? "rounded-r-md" : "";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "px-2.5 py-1.5 sm:px-3 sm:py-1.5 font-sans text-[11.5px] sm:text-[12.5px] font-semibold",
        "border whitespace-nowrap transition-colors focus:outline-none focus:z-10",
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
    </button>
  );
}
