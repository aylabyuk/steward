import { useState } from "react";
import type { Conversation } from "@twilio/conversations";
import { formatShortSunday } from "@/features/schedule/utils/dateFormat";
import { cn } from "@/lib/cn";
import {
  formatResponseBody,
  formatResponsePrompt,
  formatYesButtonLabel,
  type ResponseKind,
} from "./utils/quickResponseCopy";

interface Props {
  conversation: Conversation | null;
  ensureReady: () => Promise<boolean>;
  /** Called with the submitted answer so the caller can mirror it
   *  into `invitation.response` in Firestore (bishop-visible badge). */
  onSubmit: (answer: "yes" | "no", reason?: string) => Promise<void>;
  /** ISO `YYYY-MM-DD` of the meeting — substituted into the prompt
   *  ("Can you speak on Sun May 20?") instead of the ambiguous
   *  "this Sunday". */
  meetingDate: string;
  /** Discriminator from the invitation doc — flips the prompt /
   *  Yes-button label / persisted message body to prayer-flavoured
   *  copy ("offer the prayer") instead of speaker-flavoured. Default
   *  `"speaker"` matches the historical behaviour for legacy callers. */
  kind?: ResponseKind;
}

type Mode = "idle" | "noReason";

/** Yes / No quick-action pair. **No** expands a single-line reason
 *  field before submit. On submit:
 *   1. ensureReady() — sign-in + email-match + Twilio connect
 *   2. onSubmit() — mirror the response into Firestore
 *   3. post a Twilio message with `{ responseType, reason? }` so the
 *      thread shows the structured bubble on both sides.
 *
 *  Copy branches on `kind` via `quickResponseCopy` helpers — the
 *  body posted to Twilio is the audit-trail piece, so accuracy
 *  matters there even more than on the live UI. */
export function QuickActionButtons({
  conversation,
  ensureReady,
  onSubmit,
  meetingDate,
  kind = "speaker",
}: Props): React.ReactElement {
  const [mode, setMode] = useState<Mode>("idle");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(answer: "yes" | "no", reasonText?: string) {
    setSubmitting(true);
    setError(null);
    try {
      const ok = await ensureReady();
      if (!ok) {
        setSubmitting(false);
        return;
      }
      await onSubmit(answer, reasonText);
      if (conversation) {
        const body = formatResponseBody({ answer, kind, reasonText });
        await conversation.sendMessage(body, { responseType: answer, reason: reasonText ?? null });
      }
      setMode("idle");
      setReason("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (mode === "noReason") {
    return (
      <div className="flex flex-col gap-2 p-3 border-t border-border bg-chalk">
        <label className="font-sans text-[11.5px] text-walnut-2">Tell them why (optional)</label>
        <div className="flex gap-2 items-end">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. out of town that weekend"
            maxLength={200}
            disabled={submitting}
            className="flex-1 font-sans text-[13.5px] px-3 py-2 bg-chalk border border-border-strong rounded-md text-walnut focus:outline-none focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/15"
          />
          <button
            type="button"
            onClick={() => setMode("idle")}
            disabled={submitting}
            className="font-sans text-[13px] text-walnut-2 hover:text-walnut px-2 py-2"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => void submit("no", reason.trim() || undefined)}
            disabled={submitting}
            className="font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Send"}
          </button>
        </div>
        {error && <p className="font-sans text-[11.5px] text-bordeaux">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 border-t border-border bg-chalk">
      <p className="font-serif text-[13.5px] text-walnut-2">
        {formatResponsePrompt({ kind, shortSunday: formatShortSunday(meetingDate) })}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void submit("yes")}
          disabled={submitting}
          className={cn(
            "flex-1 font-sans text-[13px] font-semibold px-3.5 py-2.5 rounded-md",
            "border border-bordeaux-deep bg-bordeaux text-parchment hover:bg-bordeaux-deep",
            "disabled:opacity-60",
          )}
        >
          {formatYesButtonLabel(kind)}
        </button>
        <button
          type="button"
          onClick={() => setMode("noReason")}
          disabled={submitting}
          className="flex-1 font-sans text-[13px] font-semibold px-3.5 py-2.5 rounded-md border border-border-strong bg-chalk text-walnut hover:bg-parchment-2 disabled:opacity-60"
        >
          No, I can't
        </button>
      </div>
      {error && <p className="font-sans text-[11.5px] text-bordeaux">{error}</p>}
    </div>
  );
}
