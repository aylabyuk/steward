import { useState } from "react";
import type { PrayerParticipant, PrayerRole } from "@/lib/types";
import { letterCanvasToPdf } from "@/features/page-editor/utils/letterToPdf";
import { shareLetterPdf } from "@/features/page-editor/utils/shareLetterPdf";
import type { PrayerActionMode } from "./PrayerActionPicker";
import type { usePrayerWizardActions } from "./usePrayerWizardActions";
import type { usePreparePrayerInvitation } from "@/features/prayers/hooks/usePreparePrayerInvitation";

interface Args {
  wardId: string;
  date: string;
  role: PrayerRole;
  participant: PrayerParticipant;
  mode: PrayerActionMode;
  inviterName: string;
  bishopEmail: string;
  invitationId: string | undefined;
  form: ReturnType<typeof usePreparePrayerInvitation>;
  actions: ReturnType<typeof usePrayerWizardActions>;
  onComplete: () => void;
}

const ROLE_LABEL: Record<PrayerRole, string> = {
  opening: "opening prayer",
  benediction: "benediction",
};

/** Mirror of `useReviewLetterAction` for prayer-givers. Wraps the
 *  per-mode primary-action handler for the wizard's letter step,
 *  with a `postPrint` flag the host uses to swap to the
 *  hand-delivery confirm step after a Share/Print fires. */
export function useReviewPrayerLetterAction(args: Args) {
  const [postPrint, setPostPrint] = useState(false);

  async function handle() {
    const {
      mode,
      form,
      actions,
      participant,
      role,
      wardId,
      date,
      inviterName,
      bishopEmail,
      invitationId,
      onComplete,
    } = args;
    if (mode === "send") {
      await form.persistOverrides();
      const ok = await actions.sendFresh({
        wardId,
        date,
        role,
        prayerGiverName: participant.name,
        prayerGiverEmail: (participant.email ?? "").trim(),
        prayerGiverPhone: (participant.phone ?? "").trim(),
        inviterName,
        bishopReplyToEmail: bishopEmail,
        bodyMarkdown: form.letterBody,
        footerMarkdown: form.letterFooter,
        ...(form.letterStateJson ? { editorStateJson: form.letterStateJson } : {}),
      });
      if (ok) onComplete();
      return;
    }
    if (mode === "resend") {
      if (!invitationId) {
        actions.setError("No prior invitation found to resend.");
        return;
      }
      await form.persistOverrides();
      const ok = await actions.resend({
        wardId,
        invitationId,
        email: (participant.email ?? "").trim(),
        phone: (participant.phone ?? "").trim(),
      });
      if (ok) onComplete();
      return;
    }
    await form.persistOverrides();
    const target = document.querySelector<HTMLElement>("[data-print-only-letter]");
    if (!target) {
      actions.setError("Could not find the letter to share.");
      return;
    }
    try {
      const filename = pdfFilename(participant.name, date, role);
      const { file } = await letterCanvasToPdf(target, filename);
      await shareLetterPdf(file, filename, `${ROLE_LABEL[role]} for ${participant.name}`);
      setPostPrint(true);
    } catch (e) {
      actions.setError(e instanceof Error ? e.message : "Could not share the letter.");
    }
  }

  return { handle, postPrint };
}

function pdfFilename(name: string, date: string, role: PrayerRole): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${role}-prayer-${slug || "participant"}-${date}.pdf`;
}
