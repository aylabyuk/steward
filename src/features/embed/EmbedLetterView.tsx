import { MobileLetterPreview } from "@/features/page-editor/MobileLetterPreview";
import { PrepareInvitationPageMessage } from "@/app/routes/PrepareInvitationPageMessage";
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
    <main className="h-dvh w-dvw bg-parchment overflow-hidden">
      {form.hydrated ? (
        <MobileLetterPreview
          embed
          wardName={wardName}
          assignedDate={formatAssignedDate(date)}
          today={formatToday()}
          bodyMarkdown={form.letterBody}
          footerMarkdown={form.letterFooter}
          {...(form.letterStateJson ? { editorStateJson: form.letterStateJson } : {})}
          vars={vars}
        />
      ) : (
        <p className="px-5 pt-5 font-serif italic text-[14px] text-walnut-3">Loading letter…</p>
      )}
    </main>
  );
}
