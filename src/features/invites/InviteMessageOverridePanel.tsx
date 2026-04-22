import { SpeakerLetterEditor } from "@/features/templates/SpeakerLetterEditor";

interface Props {
  open: boolean;
  onToggle: () => void;
  initialBody: string;
  onChange: (body: string) => void;
  disabled?: boolean;
}

/**
 * Collapsible "Customize message" panel for the Invite Member dialog.
 * Closed by default — bishops who don't need to tweak per-invite copy
 * never see the editor. Reuses `SpeakerLetterEditor` (MDXEditor wrapper)
 * so the ward-invite and speaker-letter authoring UX match.
 */
export function InviteMessageOverridePanel({
  open,
  onToggle,
  initialBody,
  onChange,
  disabled,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="self-start font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3 hover:text-bordeaux disabled:opacity-60"
      >
        {open ? "− Use ward default" : "+ Customize message"}
      </button>
      {open && (
        <div>
          <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brass-deep mb-1.5">
            Message (greeting above the accept button)
          </div>
          <SpeakerLetterEditor
            initialMarkdown={initialBody}
            onChange={onChange}
            ariaLabel="Invite message override"
          />
          <p className="mt-1 font-serif italic text-[11.5px] text-walnut-3">
            Variables: {"{{inviteeName}}"}, {"{{wardName}}"}, {"{{inviterName}}"}, {"{{calling}}"},{" "}
            {"{{role}}"}. The sign-in link and "— Sent from Steward" footer are added automatically.
          </p>
        </div>
      )}
    </div>
  );
}
