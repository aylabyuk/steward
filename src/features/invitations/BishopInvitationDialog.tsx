import { Drawer } from "vaul";
import { useIsMobile } from "@/hooks/useMediaQuery";
import type { Speaker, SpeakerInvitation } from "@/lib/types";
import { BishopInvitationChat } from "./BishopInvitationChat";
import { InvitationLinkActions } from "./InvitationLinkActions";
import { NoInvitationPlaceholder } from "./NoInvitationPlaceholder";

interface Props {
  open: boolean;
  onClose: () => void;
  wardId: string;
  /** Null when the speaker hasn't been invited yet. The dialog still
   *  opens so the bishopric has a single place to see the speaker's
   *  current state; the body renders a "contact them directly"
   *  placeholder in that case. */
  invitationId: string | null;
  invitation: SpeakerInvitation | null;
  /** Speaker doc + its path coordinates — threaded so the chat's
   *  status banner can render the bishopric-set status and apply
   *  manual overrides via updateSpeaker. */
  speaker: Speaker;
  date: string;
  /** Speaker doc ID, OR the prayer role string when `kind === "prayer"`. */
  speakerId: string;
  /** Discriminator. Defaults to "speaker"; "prayer" routes status
   *  writes + the no-invitation placeholder's Prepare CTA to the
   *  prayer participant doc + prayer prepare-invitation route. */
  kind?: "speaker" | "prayer";
}

/** Bishop-side conversation panel. Hosts BishopInvitationChat (or the
 *  no-invitation placeholder when the speaker hasn't been invited
 *  yet) inside a `vaul` Drawer. Mobile gets a bottom sheet that
 *  slides up; desktop gets a side drawer that slides in from the
 *  right edge — better than a centered modal because the speaker's
 *  schedule context behind it stays glanceable. Drag-to-dismiss
 *  works on both (down on mobile, right on desktop). Z-index pinned
 *  to 60 so the panel sits above the Assign Speakers modal (z-50)
 *  it's launched from. */
export function BishopInvitationDialog({
  open,
  onClose,
  wardId,
  invitationId,
  invitation,
  speaker,
  date,
  speakerId,
  kind = "speaker",
}: Props): React.ReactElement | null {
  const isMobile = useIsMobile();
  const contentClass = isMobile
    ? "fixed bottom-0 left-0 right-0 z-60 mt-24 flex h-[85dvh] flex-col rounded-t-[18px] border-t border-x border-border-strong bg-chalk shadow-elev-3 outline-none"
    : "fixed inset-y-0 right-0 z-60 flex w-[min(28rem,100vw)] flex-col bg-chalk shadow-elev-3 border-l border-border-strong outline-none";
  return (
    <Drawer.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      direction={isMobile ? "bottom" : "right"}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-60 bg-[rgba(35,24,21,0.42)]" />
        <Drawer.Content aria-describedby={undefined} className={contentClass}>
          {isMobile && (
            <Drawer.Handle className="flex-none mx-auto mt-2 mb-1 h-1 w-10 rounded-full bg-walnut-2/40" />
          )}
          <Drawer.Title className="sr-only">Conversation with {speaker.name}</Drawer.Title>
          <div className="flex items-start gap-3 px-5 py-3.5 border-b border-border bg-parchment">
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium">
                Conversation
              </div>
              <div className="font-display text-xl font-semibold text-walnut tracking-[-0.01em] leading-tight mt-0.5">
                {speaker.name}
              </div>
            </div>
            {invitation && invitationId && (
              <InvitationLinkActions
                wardId={wardId}
                invitationId={invitationId}
                invitation={invitation}
              />
            )}
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-walnut-3 hover:text-walnut px-2 py-1 transition-colors"
              aria-label="Close"
            >
              Close
            </button>
          </div>
          {invitation && invitationId ? (
            <BishopInvitationChat
              wardId={wardId}
              invitationId={invitationId}
              invitation={invitation}
              speaker={speaker}
              date={date}
              speakerId={speakerId}
            />
          ) : (
            <NoInvitationPlaceholder
              wardId={wardId}
              speaker={speaker}
              speakerId={speakerId}
              date={date}
              kind={kind}
              onNavigate={onClose}
            />
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
