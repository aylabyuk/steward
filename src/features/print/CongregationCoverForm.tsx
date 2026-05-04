import { DEFAULT_PROGRAM_FOOTER_NOTE } from "./utils/programFooter";

interface Props {
  imageUrl: string;
  announcements: string;
  footerNote: string;
  onImageChange: (next: string) => void;
  onAnnouncementsChange: (next: string) => void;
  onFooterNoteChange: (next: string) => void;
}

/** Inline form for the editable bits of the congregation prepare
 *  page — rendered above the live preview. Cover image + announcements
 *  populate the left panel; footer note prints at the bottom of the
 *  right (program) panel. */
export function CongregationCoverForm({
  imageUrl,
  announcements,
  footerNote,
  onImageChange,
  onAnnouncementsChange,
  onFooterNoteChange,
}: Props) {
  return (
    <div className="mx-auto max-w-[11in] grid gap-4 mb-1 rounded-md border border-border bg-chalk px-4 py-3 sm:grid-cols-2">
      <Field label="Cover image URL">
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => onImageChange(e.target.value)}
          placeholder="https://… (optional)"
          className="w-full font-sans text-[13px] text-walnut placeholder-walnut-3 bg-parchment border border-border rounded px-2 py-1.5 focus:outline-none focus:border-bordeaux"
        />
      </Field>
      <Field label="Announcements">
        <textarea
          value={announcements}
          onChange={(e) => onAnnouncementsChange(e.target.value)}
          rows={3}
          placeholder="One announcement per line."
          className="w-full font-sans text-[13px] text-walnut placeholder-walnut-3 bg-parchment border border-border rounded px-2 py-1.5 resize-y focus:outline-none focus:border-bordeaux"
        />
      </Field>
      <Field label="Program footer note" className="sm:col-span-2">
        <input
          type="text"
          value={footerNote}
          onChange={(e) => onFooterNoteChange(e.target.value)}
          placeholder={DEFAULT_PROGRAM_FOOTER_NOTE}
          className="w-full font-sans text-[13px] text-walnut placeholder-walnut-3 bg-parchment border border-border rounded px-2 py-1.5 focus:outline-none focus:border-bordeaux"
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass-deep">
        {label}
      </span>
      {children}
    </label>
  );
}
