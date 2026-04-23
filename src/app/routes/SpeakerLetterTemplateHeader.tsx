import { RemoveIcon } from "@/features/schedule/SpeakerInviteIcons";
import { WardTemplateToolbar } from "@/features/templates/WardTemplateToolbar";

interface Props {
  canEdit: boolean;
  busy: boolean;
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
  onClose: () => void;
}

/** Sticky header for the standalone speaker-letter template page:
 *  eyebrow / title / subtitle on the left, X close top-right,
 *  mobile-only toolbar row below. Desktop toolbar lives inside the
 *  preview container on the right column. */
export function SpeakerLetterTemplateHeader({
  canEdit,
  busy,
  saving,
  onSave,
  onReset,
  onClose,
}: Props) {
  return (
    <header className="sticky top-0 z-20 shrink-0 flex flex-col gap-3 border-b border-border bg-chalk px-4 sm:px-8 pt-4 sm:pt-5 pb-3 sm:pb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass-deep">
            Ward template
          </div>
          <h1 className="font-display text-[20px] sm:text-[22px] font-semibold text-walnut leading-tight">
            Speaker invitation letter
          </h1>
          <p className="font-serif italic text-[12.5px] text-walnut-3">
            Edit the body, footer, and signature of the printed invitation. The letterhead, date,
            assigned-Sunday callout, and signature are fixed.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close tab"
          title="Close"
          className="shrink-0 -mr-1 rounded-md p-2 text-walnut-3 hover:text-bordeaux hover:bg-parchment-2 focus:outline-none focus:ring-2 focus:ring-bordeaux/30"
        >
          <RemoveIcon />
        </button>
      </div>
      <div className="lg:hidden flex justify-center">
        <WardTemplateToolbar
          canEdit={canEdit}
          busy={busy}
          saving={saving}
          onSave={onSave}
          onReset={onReset}
        />
      </div>
    </header>
  );
}
