import { DEFAULT_PROGRAM_FOOTER_NOTE } from "./utils/programFooter";

interface Props {
  imageUrl: string;
  footerNote: string;
  onImageChange: (next: string) => void;
  onFooterNoteChange: (next: string) => void;
}

/** Two-field form for the congregation-copy template editor: cover
 *  image URL and program footer note. Announcements are intentionally
 *  excluded — those are per-meeting content, edited on the prepare
 *  page. */
export function CongregationTemplateForm({
  imageUrl,
  footerNote,
  onImageChange,
  onFooterNoteChange,
}: Props) {
  return (
    <div className="mx-auto max-w-[11in] grid gap-4 mb-1 rounded-md border border-border bg-chalk px-4 py-3 sm:grid-cols-2">
      <Field label="Default cover image URL">
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => onImageChange(e.target.value)}
          placeholder="https://… (optional)"
          className="w-full font-sans text-[13px] text-walnut placeholder-walnut-3 bg-parchment border border-border rounded px-2 py-1.5 focus:outline-none focus:border-bordeaux"
        />
      </Field>
      <Field label="Default program footer note">
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass-deep">
        {label}
      </span>
      {children}
    </label>
  );
}
