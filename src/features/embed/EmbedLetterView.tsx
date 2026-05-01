import { useMemo } from "react";
import { MobileLetterPreview } from "@/features/page-editor/MobileLetterPreview";
import { resolveChipsInState } from "@/features/page-editor/utils/serializeForInterpolation";
import { PrepareInvitationPageMessage } from "@/app/routes/PrepareInvitationPageMessage";
import { PrintOnlyLetter } from "@/features/templates/PrintOnlyLetter";
import { interpolate } from "@/features/templates/utils/interpolate";
import { formatAssignedDate, formatToday } from "@/features/templates/utils/letterDates";
import type { EmbedAuthStatus } from "./useEmbedAuthBootstrap";

/** Subset of the prepare-invitation form hooks (both prayer and
 *  speaker variants) — the only fields the embed render reads. */
interface EmbedLetterForm {
  hydrated: boolean;
  letterBody: string;
  letterFooter: string;
  letterStateJson: string | null;
}

interface Props {
  authStatus: EmbedAuthStatus;
  form: EmbedLetterForm;
  date: string;
  wardName: string;
  vars: Readonly<Record<string, string>>;
}

/** Edge-to-edge view-only letter, used by both prepare pages when an
 *  iOS WebView opens them with `?embed=ios`. Pure presentational —
 *  the calling page owns the hooks (`useEmbedAuthBootstrap`, the
 *  letter-state form) and forwards their state down. Splitting this
 *  out keeps both prepare pages under the 150-LOC component cap. */
export function EmbedLetterView({ authStatus, form, date, wardName, vars }: Props) {
  // Pre-resolve chips + `{{tokens}}` for the print portal, the same
  // way `PrepareInvitationLetterTab` does — `letterCanvasToPdf` walks
  // the `[data-print-only-letter]` DOM, so the portal must already
  // hold the rendered (not template) content.
  const printEditorStateJson = useMemo(() => {
    if (!form.letterStateJson) return undefined;
    return resolveChipsInState(interpolate(form.letterStateJson, vars), vars);
  }, [form.letterStateJson, vars]);
  const renderedBody = useMemo(() => interpolate(form.letterBody, vars), [form.letterBody, vars]);
  const renderedFooter = useMemo(
    () => interpolate(form.letterFooter, vars),
    [form.letterFooter, vars],
  );
  const assignedDate = formatAssignedDate(date);
  const today = formatToday();

  if (authStatus.status === "pending") {
    return <PrepareInvitationPageMessage title="Loading…" body={null} />;
  }
  if (authStatus.status === "no-token" || authStatus.status === "error") {
    return (
      <PrepareInvitationPageMessage
        title="Authentication required"
        body="Reopen this letter from the iOS app."
      />
    );
  }
  return (
    <>
      {/* Hidden 8.5×11 portal that `useEmbedShareBridge` rasterises
       *  into a PDF for the iOS share button. Stays `display: none`
       *  on screen via `[data-print-only-letter]` styles. */}
      {form.hydrated && (
        <PrintOnlyLetter
          wardName={wardName}
          assignedDate={assignedDate}
          today={today}
          bodyMarkdown={renderedBody}
          footerMarkdown={renderedFooter}
          {...(printEditorStateJson ? { editorStateJson: printEditorStateJson } : {})}
        />
      )}
      <main className="h-dvh w-dvw bg-parchment overflow-hidden">
        {form.hydrated ? (
          <MobileLetterPreview
            embed
            wardName={wardName}
            assignedDate={assignedDate}
            today={today}
            bodyMarkdown={form.letterBody}
            footerMarkdown={form.letterFooter}
            {...(form.letterStateJson ? { editorStateJson: form.letterStateJson } : {})}
            vars={vars}
          />
        ) : (
          <p className="px-5 pt-5 font-serif italic text-[14px] text-walnut-3">Loading letter…</p>
        )}
      </main>
    </>
  );
}
