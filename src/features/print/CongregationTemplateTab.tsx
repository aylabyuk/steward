import { useState } from "react";
import { SaveBar } from "@/components/ui/SaveBar";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { CongregationCoverPanel } from "./CongregationCoverPanel";
import { CongregationProgramBody } from "./CongregationProgramBody";
import { CongregationTemplateForm } from "./CongregationTemplateForm";
import { formatLongDate } from "./utils/programData";
import { DEFAULT_PROGRAM_FOOTER_NOTE, resolveCoverImageUrl } from "./utils/programFooter";
import { writeWardCongregationDefaults } from "./utils/writeWardCongregationDefaults";

/** Congregation-copy template editor on /settings/templates/programs.
 *  Mirrors the per-Sunday prepare-page UX (form + bulletin preview)
 *  but writes ward-level defaults — image URL and footer note — that
 *  drive every Sunday's print unless the bishop overrides them on the
 *  prepare page. Announcements are intentionally not editable here:
 *  they're per-week content, not a template concept. */
export function CongregationTemplateTab() {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const ward = useWardSettings();

  const [imageDraft, setImageDraft] = useState<string | null>(null);
  const [footerDraft, setFooterDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const wardDefaults = ward.data?.congregationDefaults;
  const initialImage = wardDefaults?.coverImageUrl ?? "";
  const initialFooter = wardDefaults?.programFooterNote ?? DEFAULT_PROGRAM_FOOTER_NOTE;
  const imageUrl = imageDraft ?? initialImage;
  const footerNote = footerDraft ?? initialFooter;
  const dirty = imageDraft !== null || footerDraft !== null;

  const wardName = ward.data?.name ?? "Ward";
  // Preview uses today's date as a stand-in. The actual print resolves
  // to the meeting date, but visually this lets the bishop see how a
  // typical bulletin looks against their template.
  const sampleDate = new Date().toISOString().slice(0, 10);
  const dateLong = formatLongDate(sampleDate);
  const previewImageUrl = resolveCoverImageUrl(imageUrl, null);

  async function save() {
    if (!wardId) return;
    setSaving(true);
    setError(null);
    try {
      await writeWardCongregationDefaults(wardId, {
        coverImageUrl: imageUrl.trim().length > 0 ? imageUrl.trim() : null,
        programFooterNote: footerNote.trim().length > 0 ? footerNote.trim() : null,
      });
      setImageDraft(null);
      setFooterDraft(null);
      setSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    } catch (e) {
      setError(friendlyWriteError(e));
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setImageDraft(null);
    setFooterDraft(null);
    setError(null);
  }

  return (
    <>
      <div className="flex-1 min-h-0 overflow-auto bg-parchment py-6 px-4 sm:px-8 pb-24">
        <CongregationTemplateForm
          imageUrl={imageUrl}
          footerNote={footerNote}
          onImageChange={setImageDraft}
          onFooterNoteChange={setFooterDraft}
        />

        {/* Letter-landscape sheet at print scale — same dimensions and
            structure as /print/:date/congregation. Empty meeting fields
            render as blank lines so the bishop sees where each piece
            lands on the printed bulletin. */}
        <div
          className="mx-auto mt-6 bg-chalk shadow-[0_4px_24px_rgba(35,24,21,0.08)] border border-border rounded-sm"
          style={{ width: "11in", height: "8.5in" }}
        >
          <div className="relative grid grid-cols-2 h-full">
            <div className="px-[0.35in] py-[0.35in]">
              <CongregationCoverPanel
                wardName={wardName}
                dateLong={dateLong}
                announcements=""
                imageUrl={previewImageUrl}
              />
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-1/2 border-l border-dashed border-walnut-3"
            />
            <div className="px-[0.35in] py-[0.35in]">
              <CongregationProgramBody
                date={sampleDate}
                meeting={null}
                speakers={[]}
                ward={ward.data ?? null}
                templateJson={null}
                footerNoteOverride={footerNote}
              />
            </div>
          </div>
        </div>
        <p className="mt-2 mb-3 text-center font-serif italic text-[11px] text-walnut-3">
          Letter, landscape · 11" × 8.5" · ward defaults apply when a meeting hasn't been customised
          on the prepare page.
        </p>
      </div>

      <SaveBar
        dirty={dirty}
        saving={saving}
        savedAt={savedAt}
        error={error}
        onDiscard={discard}
        onSave={() => void save()}
      />
    </>
  );
}
