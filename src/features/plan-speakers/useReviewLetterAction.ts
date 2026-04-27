import { useState } from "react";
import type { Speaker } from "@/lib/types";
import type { WithId } from "@/hooks/_sub";
import { letterCanvasToPdf } from "@/features/page-editor/letterToPdf";
import { shareLetterPdf } from "@/features/page-editor/shareLetterPdf";
import type { ActionMode } from "./SpeakerActionPicker";
import type { useWizardActions } from "./useWizardActions";
import type { usePrepareInvitation } from "@/features/templates/usePrepareInvitation";

interface Args {
  wardId: string;
  date: string;
  speaker: WithId<Speaker>;
  mode: ActionMode;
  inviterName: string;
  bishopEmail: string;
  invitationId: string | undefined;
  form: ReturnType<typeof usePrepareInvitation>;
  actions: ReturnType<typeof useWizardActions>;
  onComplete: () => void;
}

/** Bundles the per-mode primary-action handler for the wizard letter
 *  step. Returns the handler + a `postPrint` flag so the host can
 *  swap the UI to the hand-delivery confirm step after a print. */
export function useReviewLetterAction(args: Args) {
  const [postPrint, setPostPrint] = useState(false);

  async function handle() {
    const {
      mode,
      form,
      actions,
      speaker,
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
        speakerId: speaker.id,
        speakerName: speaker.data.name,
        ...(speaker.data.topic ? { speakerTopic: speaker.data.topic } : {}),
        speakerEmail: (speaker.data.email ?? "").trim(),
        speakerPhone: (speaker.data.phone ?? "").trim(),
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
        email: (speaker.data.email ?? "").trim(),
        phone: (speaker.data.phone ?? "").trim(),
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
      const filename = pdfFilename(speaker.data.name, date);
      const { file } = await letterCanvasToPdf(target, filename);
      await shareLetterPdf(file, filename, `Invitation for ${speaker.data.name}`);
      setPostPrint(true);
    } catch (e) {
      actions.setError(e instanceof Error ? e.message : "Could not share the letter.");
    }
  }

  return { handle, postPrint };
}

function pdfFilename(speakerName: string, date: string): string {
  const slug = speakerName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `invitation-${slug || "speaker"}-${date}.pdf`;
}
