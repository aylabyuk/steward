import { Link, useParams } from "react-router";
import { Avatar } from "@/components/ui/Avatar";
import { ScaledLetterPreview } from "@/features/templates/ScaledLetterPreview";
import { useSpeakerInvitation } from "@/features/templates/useSpeakerInvitation";
import { useWardMembers } from "@/hooks/useWardMembers";

function formatTimestamp(value: unknown): string | null {
  if (!value) return null;
  const ts = value as { toDate?: () => Date };
  if (typeof ts.toDate === "function") return ts.toDate().toLocaleString();
  if (value instanceof Date) return value.toLocaleString();
  return null;
}

/** Read-only view of a speaker invitation for the bishopric. Linked
 *  from the bishopric receipt email — shows the frozen letter + the
 *  response's provenance block without the chat pane. For the full
 *  workspace (chat, Apply, Resend) the bishopric goes to Prepare. */
export function InvitationViewPage(): React.ReactElement {
  const { wardId, invitationId } = useParams<{ wardId: string; invitationId: string }>();
  const letter = useSpeakerInvitation(wardId, invitationId);
  const members = useWardMembers();

  if (letter.kind === "loading") return <CenteredNote>Loading…</CenteredNote>;
  if (letter.kind === "not-found") return <CenteredNote>Invitation not found.</CenteredNote>;
  if (letter.kind === "error")
    return <CenteredNote>Couldn't load invitation — {letter.message}</CenteredNote>;

  const inv = letter.invitation;
  const response = inv.response;
  const acknowledger = response?.acknowledgedBy
    ? members.data.find((m) => m.id === response.acknowledgedBy)
    : null;
  const acknowledgedByName = acknowledger?.data.displayName ?? null;
  const prepareHref = `/week/${inv.speakerRef.meetingDate}/speaker/${inv.speakerRef.speakerId}/prepare`;

  return (
    <main className="max-w-3xl mx-auto flex flex-col gap-4 py-6 px-4">
      <header>
        <h1 className="font-sans text-xl font-semibold text-walnut">
          {inv.speakerName} — {inv.assignedDate}
        </h1>
        <p className="font-serif italic text-sm text-walnut-2 mt-0.5">
          Read-only view. Jump to{" "}
          <Link to={prepareHref} className="underline decoration-brass-soft">
            Prepare invitation
          </Link>{" "}
          for the full workspace with chat.
        </p>
      </header>

      {response && (
        <section className="bg-chalk border border-border rounded-lg p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium">
            Response
          </div>
          <div className="font-sans text-lg text-walnut mt-1">
            {response.answer === "yes" ? "Accepted" : "Declined"}
          </div>
          {response.reason && (
            <blockquote className="mt-2 pl-3 border-l-2 border-brass-soft font-serif italic text-[13.5px] text-walnut-2">
              {response.reason}
            </blockquote>
          )}
          <dl className="mt-3 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.08em] text-walnut-3">
            {formatTimestamp(response.respondedAt) && (
              <>
                <dt>Responded</dt>
                <dd>{formatTimestamp(response.respondedAt)}</dd>
              </>
            )}
            {formatTimestamp(response.acknowledgedAt) && (
              <>
                <dt>Applied</dt>
                <dd className="flex items-center gap-2 flex-wrap">
                  <span>{formatTimestamp(response.acknowledgedAt)}</span>
                  {acknowledger && (
                    <>
                      <span aria-hidden="true">·</span>
                      <Avatar
                        user={{
                          uid: acknowledger.id,
                          displayName: acknowledgedByName,
                          photoURL: acknowledger.data.photoURL ?? null,
                        }}
                        size="sm"
                      />
                      <span className="normal-case tracking-normal">{acknowledgedByName}</span>
                    </>
                  )}
                </dd>
              </>
            )}
          </dl>
        </section>
      )}

      <div className="bg-chalk border border-border rounded-lg shadow-elev-1 overflow-hidden">
        <ScaledLetterPreview
          naked
          height="60vh"
          wardName={inv.wardName}
          assignedDate={inv.assignedDate}
          today={inv.sentOn}
          bodyMarkdown={inv.bodyMarkdown}
          footerMarkdown={inv.footerMarkdown}
        />
      </div>
    </main>
  );
}

function CenteredNote({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <main className="grid min-h-dvh place-items-center">
      <p className="font-serif italic text-walnut-2">{children}</p>
    </main>
  );
}
