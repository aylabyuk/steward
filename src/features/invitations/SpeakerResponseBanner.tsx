interface Props {
  answer: "yes" | "no" | null | undefined;
}

/** Speaker-side confirmation banner rendered under the conversation
 *  header once the speaker has submitted their Yes/No reply. Mirrors
 *  the bishop-side status banner (colour + gradient) so the speaker
 *  always sees their committed answer without having to re-read the
 *  quick-action buttons (which hide after submission). */
export function SpeakerResponseBanner({ answer }: Props): React.ReactElement | null {
  if (answer === "yes") {
    return (
      <div className="px-4 py-3 border-b border-border bg-gradient-to-br from-success-soft to-success-soft/60">
        <p className="font-sans text-[13.5px] font-semibold text-success leading-snug">
          You accepted this invitation. Thank you!
        </p>
        <p className="font-serif italic text-[12.5px] text-walnut-2 mt-1">
          The bishopric will follow up with any remaining details in the chat below.
        </p>
      </div>
    );
  }
  if (answer === "no") {
    return (
      <div className="px-4 py-3 border-b border-border bg-gradient-to-br from-danger-soft to-danger-soft/60">
        <p className="font-sans text-[13.5px] font-semibold text-bordeaux leading-snug">
          You declined this invitation.
        </p>
        <p className="font-serif italic text-[12.5px] text-walnut-2 mt-1">
          The bishopric has been notified and will respond in the chat below if needed.
        </p>
      </div>
    );
  }
  return null;
}
