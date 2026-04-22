import { useMemo } from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { useWardSettings } from "@/hooks/useWardSettings";
import { LetterCanvas } from "./LetterCanvas";
import { OverrideDialogFooter } from "./OverrideDialogFooter";
import { EditorSection } from "./SpeakerLetterEditor";
import { interpolate } from "./interpolate";
import { formatAssignedDate, formatToday } from "./letterDates";
import { useLetterOverrideForm } from "./useLetterOverrideForm";
import { useSpeakerLetterTemplate } from "./useSpeakerLetterTemplate";

interface Props {
  wardId: string;
  date: string;
  speakerId: string;
  speakerName: string;
  speakerTopic: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Per-speaker override editor. Starts from the current override (if
 * any) or the ward template. Variables stay as `{{tokens}}` in the
 * stored Markdown; the preview shows them interpolated for this
 * speaker so the sender reads it the way the recipient will.
 */
export function SpeakerLetterOverrideDialog(props: Props) {
  const { wardId, date, speakerId, speakerName, speakerTopic, open, onClose } = props;
  const ward = useWardSettings();
  const { data: template } = useSpeakerLetterTemplate();
  const form = useLetterOverrideForm({
    wardId,
    date,
    speakerId,
    open,
    template,
    onDone: onClose,
  });
  useLockBodyScroll(open);

  const wardName = ward.data?.name ?? "";
  const vars = useMemo(
    () => ({
      speakerName,
      topic: speakerTopic.trim() || "a topic of your choosing",
      date: formatAssignedDate(date),
      today: formatToday(),
      wardName,
      inviterName: "Bishop (example)",
    }),
    [speakerName, speakerTopic, date, wardName],
  );
  const renderedBody = useMemo(() => interpolate(form.body, vars), [form.body, vars]);
  const renderedFooter = useMemo(() => interpolate(form.footer, vars), [form.footer, vars]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit letter for ${speakerName}`}
    >
      <div className="w-full max-w-230 max-h-[90vh] overflow-auto rounded-[14px] border border-border-strong bg-chalk p-6 shadow-elev-3">
        <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-brass-deep">
          Per-speaker letter
        </div>
        <h2 className="font-display text-[20px] font-semibold text-walnut mb-1">
          Edit letter for {speakerName}
        </h2>
        <p className="mb-5 font-serif italic text-[13px] text-walnut-3">
          Tweaks live on this speaker only; the ward default stays as-is.
          {form.hasOverride ? " Reset to return to the ward default." : ""}
        </p>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <EditorSection
              label="Letter body"
              initialMarkdown={form.body}
              onChange={form.setBody}
            />
            <EditorSection
              label="Footer (scripture)"
              initialMarkdown={form.footer}
              onChange={form.setFooter}
            />
          </div>
          <aside className="flex flex-col gap-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
              Preview — this speaker
            </div>
            <LetterCanvas
              compact
              wardName={wardName}
              assignedDate={vars.date}
              today={vars.today}
              bodyMarkdown={renderedBody}
              footerMarkdown={renderedFooter}
            />
          </aside>
        </div>

        {form.error && <p className="mt-4 font-sans text-[12.5px] text-bordeaux">{form.error}</p>}

        <OverrideDialogFooter
          saving={form.saving}
          canReset={Boolean(form.hasOverride)}
          onCancel={onClose}
          onReset={() => void form.reset()}
          onSave={() => void form.save()}
        />
      </div>
    </div>
  );
}
