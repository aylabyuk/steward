import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import type { ChatMessage } from "./useConversation";

interface Props {
  messages: readonly ChatMessage[];
  currentIdentity: string | null;
  loading?: boolean;
}

/** Bubble list for a Twilio conversation. Left bubbles are "the
 *  other side" (speaker for a bishop viewer; bishop for a speaker
 *  viewer); right bubbles are the viewer's own messages. Structured
 *  responseType messages render with a distinguishing badge. */
export function ConversationThread({ messages, currentIdentity, loading }: Props): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  if (loading) {
    return <p className="font-serif italic text-[14px] text-walnut-3 p-4">Loading conversation…</p>;
  }
  if (messages.length === 0) {
    return (
      <p className="font-serif italic text-[14px] text-walnut-3 p-4">
        Say hello — messages appear live for both you and the bishopric.
      </p>
    );
  }

  return (
    <div ref={scrollRef} className="flex flex-col gap-2 p-4 overflow-y-auto max-h-[60vh]">
      {messages.map((m) => {
        const mine = m.author === currentIdentity;
        const responseType = m.attributes?.responseType as "yes" | "no" | undefined;
        return (
          <div
            key={m.sid}
            className={cn("flex flex-col gap-0.5 max-w-[80%]", mine ? "self-end items-end" : "self-start items-start")}
          >
            {responseType && (
              <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brass-deep">
                {responseType === "yes" ? "Response · Yes" : "Response · No"}
              </span>
            )}
            <div
              className={cn(
                "rounded-[12px] px-3 py-2 text-[13.5px] leading-snug whitespace-pre-wrap",
                mine
                  ? "bg-bordeaux text-parchment"
                  : "bg-parchment-2 border border-border text-walnut",
                responseType === "yes" && "border-success border-2",
                responseType === "no" && "border-bordeaux border-2",
              )}
            >
              {m.body}
            </div>
            {m.dateCreated && (
              <span className="font-mono text-[9.5px] text-walnut-3">
                {m.dateCreated.toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
