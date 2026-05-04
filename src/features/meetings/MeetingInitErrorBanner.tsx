interface Props {
  error: Error;
  /** Where the error came from — drives the headline copy. `init`
   *  means `ensureMeetingDoc` threw (most often a rules denial on
   *  the meeting/history transaction). `subscription` means the live
   *  meeting doc subscription failed — usually a Zod parse error
   *  against an existing-but-malformed doc, or a permission denial
   *  on the read. */
  source: "init" | "subscription";
  onRetry: () => void;
}

const HEADLINE: Record<Props["source"], string> = {
  init: "Couldn't initialize this Sunday's meeting.",
  subscription: "Couldn't load this Sunday's meeting.",
};

/** Surfaces silent failures on the week editor so the bishop sees
 *  what went wrong instead of an indefinite "Meeting not created
 *  yet" placeholder. */
export function MeetingInitErrorBanner({ error, source, onRetry }: Props) {
  return (
    <div
      role="alert"
      className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-bordeaux/40 bg-bordeaux/5 px-4 py-3"
    >
      <WarnIcon />
      <div className="flex-1 min-w-0">
        <p className="font-sans text-[13.5px] font-semibold text-bordeaux">{HEADLINE[source]}</p>
        <p className="font-sans text-[12.5px] text-walnut-2 mt-1 break-words">{error.message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="font-sans text-[13px] font-semibold px-3 py-1.5 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment shadow-[0_1px_0_rgba(35,24,21,0.18)] hover:bg-bordeaux-deep transition-colors whitespace-nowrap"
      >
        Try again
      </button>
    </div>
  );
}

function WarnIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-bordeaux shrink-0"
      aria-hidden
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
