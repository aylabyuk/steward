export type CtaVariant = "reply" | "unread";

interface Props {
  variant: CtaVariant;
  /** Discriminator from the invitation doc — adjusts the "speaking
   *  invitation" copy to "prayer invitation" for prayer-givers. */
  kind?: "speaker" | "prayer";
  onTap: () => void;
}

/** Top-of-viewport nudge that tells the speaker they should open the
 *  chat drawer. Shown only while the drawer is closed and something
 *  demands attention (no response yet, or an unread bishop message).
 *  Taps anywhere on the banner open the drawer. */
export function SpeakerChatCTABanner({ variant, kind, onTap }: Props): React.ReactElement {
  const copy =
    variant === "reply" ? (kind === "prayer" ? REPLY_COPY_PRAYER : REPLY_COPY) : UNREAD_COPY;
  return (
    <button
      type="button"
      onClick={onTap}
      className="fixed inset-x-0 top-0 z-10 w-full pt-[env(safe-area-inset-top)] bg-bordeaux text-parchment shadow-elev-3 animate-[fade_160ms_ease-out]"
      aria-label={copy.aria}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 min-w-0">
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-parchment/15"
          >
            {variant === "reply" ? <PenIcon /> : <ChatIcon />}
          </span>
          <span className="font-sans text-[13.5px] font-semibold text-left truncate">
            {copy.body}
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] bg-parchment/15 px-2.5 py-1 rounded-full shrink-0">
          {copy.action}
        </span>
      </div>
    </button>
  );
}

const REPLY_COPY = {
  body: "Please reply to the speaking invitation",
  action: "Reply now",
  aria: "Please reply to the speaking invitation — tap to open the chat",
};

const REPLY_COPY_PRAYER = {
  body: "Please reply to the prayer invitation",
  action: "Reply now",
  aria: "Please reply to the prayer invitation — tap to open the chat",
};

const UNREAD_COPY = {
  body: "New message from the bishopric",
  action: "Open chat",
  aria: "New message from the bishopric — tap to open the chat",
};

function PenIcon() {
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
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function ChatIcon() {
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
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
