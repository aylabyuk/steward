interface Props {
  onClose?: (() => void) | undefined;
}

/** Speaker-side chat pane header: a small eyebrow/subheading strip
 *  with an optional Close button on the right. The Close button is
 *  only rendered when the parent (the floating drawer on the invite
 *  page) supplies a handler — the inline layout omits it. */
export function SpeakerChatHeader({ onClose }: Props) {
  return (
    <header className="flex items-start gap-3 px-4 py-3 border-b border-border bg-parchment">
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium">
          Conversation with the bishopric
        </div>
        <p className="font-serif text-[12.5px] text-walnut-2 mt-0.5">
          This is a group conversation — the bishop, counselors, and clerks can all see and reply.
        </p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-walnut-3 hover:text-walnut px-2 py-1 transition-colors"
          aria-label="Close conversation"
        >
          Close
        </button>
      )}
    </header>
  );
}
