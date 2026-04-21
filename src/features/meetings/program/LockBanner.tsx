interface Props {
  status: string;
  onUnlock: () => void;
}

/**
 * Shown above the section cards when a meeting is in a non-draft status
 * (pending_approval or approved). Editing is blocked until the user
 * explicitly chooses to return the program to draft.
 */
export function LockBanner({ status, onUnlock }: Props) {
  const label = status === "approved" ? "approved" : "pending approval";
  return (
    <div className="mb-4 rounded-xl border border-info-soft bg-[linear-gradient(180deg,rgba(60,85,100,0.08),rgba(60,85,100,0.02))] px-4 py-3 flex items-center gap-3 flex-wrap">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-info shrink-0"
      >
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <span className="font-sans text-[13.5px] text-walnut flex-1 min-w-0">
        This program is <strong className="font-semibold">{label}</strong> and locked. Return it to draft to make changes.
      </span>
      <button
        type="button"
        onClick={onUnlock}
        className="font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment shadow-[0_1px_0_rgba(35,24,21,0.18)] hover:bg-bordeaux-deep transition-colors"
      >
        Return to draft &amp; edit
      </button>
    </div>
  );
}
