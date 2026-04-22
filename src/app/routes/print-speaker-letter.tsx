import { useEffect, useMemo } from "react";
import { useParams } from "react-router";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useSpeakers } from "@/hooks/useMeeting";
import { useWardSettings } from "@/hooks/useWardSettings";
import { LetterCanvas } from "@/features/templates/LetterCanvas";
import { formatAssignedDate, formatToday } from "@/features/templates/letterDates";
import { interpolate } from "@/features/templates/interpolate";
import {
  DEFAULT_SPEAKER_LETTER_BODY,
  DEFAULT_SPEAKER_LETTER_FOOTER,
} from "@/features/templates/speakerLetterDefaults";
import { useSpeakerLetterTemplate } from "@/features/templates/useSpeakerLetterTemplate";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";

/** Standalone print-only page for a speaker letter. Reads the speaker
 *  doc + ward template from Firestore, resolves override → template →
 *  seed default, renders the same LetterCanvas used in the preview
 *  at true 8.5×11 dimensions, and auto-triggers `window.print()` once
 *  the fonts are ready. The caller (Prepare Invitation page) writes
 *  any pending override before opening this URL so what prints
 *  reflects the editor state. */
export function PrintSpeakerLetterPage() {
  const { date, speakerId } = useParams<{ date: string; speakerId: string }>();
  const wardId = useCurrentWardStore((s) => s.wardId);
  const me = useCurrentMember();
  const authUser = useAuthStore((s) => s.user);
  const ward = useWardSettings();
  const speakers = useSpeakers(date ?? null);
  const { data: template } = useSpeakerLetterTemplate();

  const speaker = speakers.data?.find((s) => s.id === speakerId) ?? null;
  const override = speaker?.data.letterOverride;

  const inviterName =
    me?.data.displayName ?? authUser?.displayName ?? authUser?.email ?? "The bishopric";
  const wardName = ward.data?.name ?? "";

  const vars = useMemo(
    () => ({
      speakerName: speaker?.data.name ?? "",
      topic: speaker?.data.topic?.trim() || "a topic of your choosing",
      date: date ? formatAssignedDate(date) : "",
      today: formatToday(),
      wardName,
      inviterName,
    }),
    [speaker?.data.name, speaker?.data.topic, date, wardName, inviterName],
  );

  const bodySrc = override?.bodyMarkdown ?? template?.bodyMarkdown ?? DEFAULT_SPEAKER_LETTER_BODY;
  const footerSrc =
    override?.footerMarkdown ?? template?.footerMarkdown ?? DEFAULT_SPEAKER_LETTER_FOOTER;
  const renderedBody = interpolate(bodySrc, vars);
  const renderedFooter = interpolate(footerSrc, vars);

  const ready = Boolean(wardId && speaker && !speakers.loading);

  useEffect(() => {
    if (!ready) return;
    // Wait for fonts so the letter doesn't print in a fallback face,
    // plus a small buffer for react-markdown to finish rendering.
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) setTimeout(() => window.print(), 150);
    });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!ready) {
    return (
      <main className="min-h-dvh grid place-items-center font-serif italic text-walnut-3">
        Preparing letter for print…
      </main>
    );
  }

  return (
    <>
      <style>{`
        @page { size: letter; margin: 0; }
        @media screen {
          html, body { background: #ede6d4; }
          .print-stage { min-height: 100dvh; display: flex; justify-content: center; padding: 2rem 1rem; }
        }
        @media print {
          html, body { background: white; }
          .print-stage { padding: 0; }
        }
      `}</style>
      <main className="print-stage">
        <LetterCanvas
          wardName={wardName}
          assignedDate={vars.date}
          today={vars.today}
          bodyMarkdown={renderedBody}
          footerMarkdown={renderedFooter}
        />
      </main>
    </>
  );
}
