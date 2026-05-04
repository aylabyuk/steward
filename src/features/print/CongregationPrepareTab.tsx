import { useState } from "react";
import { SaveBar } from "@/components/ui/SaveBar";
import { useMeeting, useSpeakers } from "@/hooks/useMeeting";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { useProgramTemplate } from "@/features/program-templates/hooks/useProgramTemplate";
import { CongregationCoverForm } from "./CongregationCoverForm";
import { CongregationCoverPanel } from "./CongregationCoverPanel";
import { CongregationProgramBody } from "./CongregationProgramBody";
import { formatLongDate } from "./utils/programData";
import { DEFAULT_PROGRAM_FOOTER_NOTE } from "./utils/programFooter";
import { writeMeetingCover } from "./utils/writeMeetingCover";

interface Props {
  date: string;
}

/** Congregation tab on /week/:date/prepare. Live preview of what
 *  prints — cover panel on the left, program panel on the right —
 *  with two inline form controls for the editable bits: cover image
 *  URL and announcements. Everything else (presiding, hymns, etc.)
 *  is auto-populated from the meeting doc and edited back in
 *  /week/:date. */
export function CongregationPrepareTab({ date }: Props) {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const ward = useWardSettings();
  const meeting = useMeeting(date);
  const speakers = useSpeakers(date);
  const template = useProgramTemplate("congregationProgram");

  const [imageDraft, setImageDraft] = useState<string | null>(null);
  const [announceDraft, setAnnounceDraft] = useState<string | null>(null);
  const [footerDraft, setFooterDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const initialImage = meeting.data?.coverImageUrl ?? "";
  const initialAnnounce = meeting.data?.announcements ?? "";
  // Pre-fill with the built-in default when nothing's saved — gives
  // the bishop concrete text to tweak instead of an empty box. The
  // form stays "clean" (dirty stays false) until they actually edit.
  const initialFooter = meeting.data?.programFooterNote ?? DEFAULT_PROGRAM_FOOTER_NOTE;
  const imageUrl = imageDraft ?? initialImage;
  const announcements = announceDraft ?? initialAnnounce;
  const footerNote = footerDraft ?? initialFooter;
  const dirty = imageDraft !== null || announceDraft !== null || footerDraft !== null;

  const wardName = ward.data?.name ?? "Ward";
  const dateLong = formatLongDate(date);
  const override = meeting.data?.programs?.congregation;
  const templateJson = override?.editorStateJson ?? template.data?.editorStateJson ?? null;

  async function save() {
    if (!wardId) return;
    setSaving(true);
    setError(null);
    try {
      await writeMeetingCover(wardId, date, {
        coverImageUrl: imageUrl.trim().length > 0 ? imageUrl.trim() : null,
        announcements,
        programFooterNote: footerNote.trim().length > 0 ? footerNote.trim() : null,
      });
      setImageDraft(null);
      setAnnounceDraft(null);
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
    setAnnounceDraft(null);
    setFooterDraft(null);
    setError(null);
  }

  return (
    <>
      <div className="flex-1 min-h-0 overflow-auto bg-parchment py-6 px-4 sm:px-8 pb-24">
        <CongregationCoverForm
          imageUrl={imageUrl}
          announcements={announcements}
          footerNote={footerNote}
          onImageChange={(v) => setImageDraft(v)}
          onAnnouncementsChange={(v) => setAnnounceDraft(v)}
          onFooterNoteChange={(v) => setFooterDraft(v)}
        />

        {/* Page sheet — letter landscape (11" × 8.5") at print scale.
            What you see here is what the printer puts on the paper. */}
        <div
          className="mx-auto mt-6 bg-chalk shadow-[0_4px_24px_rgba(35,24,21,0.08)] border border-border rounded-sm"
          style={{ width: "11in", height: "8.5in" }}
        >
          <div className="relative grid grid-cols-2 h-full">
            <div className="px-[0.35in] py-[0.35in]">
              <CongregationCoverPanel
                wardName={wardName}
                dateLong={dateLong}
                announcements={announcements}
                imageUrl={imageUrl.trim().length > 0 ? imageUrl.trim() : null}
              />
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-1/2 border-l border-dashed border-walnut-3"
            />
            <div className="px-[0.35in] py-[0.35in]">
              <CongregationProgramBody
                date={date}
                meeting={meeting.data ?? null}
                speakers={speakers.data}
                ward={ward.data ?? null}
                templateJson={templateJson}
                footerNoteOverride={footerNote}
              />
            </div>
          </div>
        </div>
        <p className="mt-2 mb-3 text-center font-serif italic text-[11px] text-walnut-3">
          Letter, landscape · 11" × 8.5" · fold down the middle — cover on the left, program on the
          right.
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
