import { useState } from "react";
import type { Conversation } from "@twilio/conversations";

interface Props {
  conversation: Conversation | null;
  /** Called before the send attempt to ensure the client is
   *  authenticated + connected. Speaker-side wraps this with
   *  sign-in + email-match + token mint. Returns a truthy value
   *  to proceed, throws (or returns false) to abort. */
  ensureReady?: () => Promise<boolean>;
  placeholder?: string;
  disabled?: boolean;
  /** When true, render a subtle SMS-segment counter that appears
   *  once the draft nears 160 chars. Bishop-side messages may be
   *  delivered as SMS if the speaker is replying from their phone;
   *  speakers who have the web open don't pay for SMS segments. */
  showSmsHint?: boolean;
}

const SMS_SEGMENT = 160;

/** Multi-row composer with an optimistic pending bubble. Default
 *  height is three rows; drag the bottom-right corner to expand.
 *  Sends plain-text messages via the Twilio conversation. Quick-action
 *  (Yes/No) posts go through QuickActionButtons instead — those
 *  carry structured attributes. */
export function ConversationComposer({
  conversation,
  ensureReady,
  placeholder = "Type a message…",
  disabled,
  showSmsHint,
}: Props): React.ReactElement {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const text = value.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    setPendingText(text);
    setValue("");
    try {
      if (ensureReady) {
        const ok = await ensureReady();
        if (!ok) throw new Error("Sign-in required.");
      }
      if (!conversation) throw new Error("Not connected.");
      await conversation.sendMessage(text);
    } catch (err) {
      setError((err as Error).message);
      setValue(text);
    } finally {
      setSending(false);
      setPendingText(null);
    }
  }

  return (
    <div className="flex flex-col bg-chalk border-t border-border">
      {pendingText && <PendingBubble text={pendingText} />}
      <div className="flex flex-col gap-1.5 p-3">
        {error && <p className="font-sans text-[11.5px] text-bordeaux">{error}</p>}
        <div className="flex gap-2 items-end">
          <textarea
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (conversation && e.target.value.trim()) void conversation.typing();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder={placeholder}
            disabled={disabled || sending}
            rows={3}
            aria-label={placeholder}
            className="flex-1 font-sans text-[13.5px] px-3 py-2 bg-chalk border border-border-strong rounded-md text-walnut placeholder:text-walnut-3 focus:outline-none focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/15 resize-y min-h-18 disabled:bg-parchment-2"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!value.trim() || disabled || sending}
            className="font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment shadow-[0_1px_0_rgba(35,24,21,0.18)] hover:bg-bordeaux-deep disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
        {showSmsHint && value.length >= 140 && <SmsHint length={value.length} />}
      </div>
    </div>
  );
}

function PendingBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end px-4 pt-3" aria-live="polite">
      <div className="max-w-[85%] rounded-[18px] bg-bordeaux/70 text-parchment px-3.5 py-2 text-[14px] whitespace-pre-wrap wrap-break-word opacity-75 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-block w-2 h-2 rounded-full bg-parchment/70 animate-pulse"
        />
        <span className="sr-only">Sending: </span>
        {text}
      </div>
    </div>
  );
}

function SmsHint({ length }: { length: number }) {
  const segments = Math.ceil(length / SMS_SEGMENT);
  return (
    <p className="font-mono text-[10px] text-walnut-3">
      {length} / {SMS_SEGMENT} —{" "}
      {segments > 1 ? `sends as ${segments} SMS segments` : "still one SMS segment"}
    </p>
  );
}
