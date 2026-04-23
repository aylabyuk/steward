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
}

/** Single-line auto-growing composer. Sends a plain-text message
 *  via the Twilio conversation. Quick-action (Yes/No) posts go
 *  through QuickActionButtons instead — those carry structured
 *  attributes. */
export function ConversationComposer({
  conversation,
  ensureReady,
  placeholder = "Type a message…",
  disabled,
}: Props): React.ReactElement {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!value.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      if (ensureReady) {
        const ok = await ensureReady();
        if (!ok) {
          setSending(false);
          return;
        }
      }
      if (!conversation) throw new Error("Not connected.");
      await conversation.sendMessage(value.trim());
      setValue("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 p-3 border-t border-border bg-chalk">
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
          rows={1}
          aria-label={placeholder}
          className="flex-1 font-sans text-[13.5px] px-3 py-2 bg-chalk border border-border-strong rounded-md text-walnut placeholder:text-walnut-3 focus:outline-none focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/15 resize-none disabled:bg-parchment-2"
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
    </div>
  );
}
