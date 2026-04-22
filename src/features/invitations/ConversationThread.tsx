import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import type { AuthorMap, ChatMessage } from "./useConversation";

interface Props {
  messages: readonly ChatMessage[];
  currentIdentity: string | null;
  authors: AuthorMap;
  loading?: boolean;
}

/** Bubble list for a Twilio conversation. Mine = right-aligned with
 *  a colored initials avatar; others = left-aligned. Structured
 *  responseType messages render with a distinguishing badge. Author
 *  display name is read from the Twilio participant attributes via
 *  the `authors` map. */
export function ConversationThread({
  messages,
  currentIdentity,
  authors,
  loading,
}: Props): React.ReactElement {
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
        Say hello — messages appear live for everyone in the conversation.
      </p>
    );
  }

  return (
    <div ref={scrollRef} className="flex flex-col gap-3 p-4 overflow-y-auto max-h-[60vh]">
      {messages.map((m) => {
        const mine = m.author === currentIdentity;
        const author = authors.get(m.author);
        const displayName = author?.displayName ?? (m.author.startsWith("speaker:") ? "Speaker" : "Unknown");
        const responseType = m.attributes?.responseType as "yes" | "no" | undefined;
        return (
          <Row
            key={m.sid}
            message={m}
            mine={mine}
            displayName={displayName}
            role={author?.role}
            responseType={responseType}
          />
        );
      })}
    </div>
  );
}

interface RowProps {
  message: ChatMessage;
  mine: boolean;
  displayName: string;
  role: "speaker" | "bishopric" | "clerk" | undefined;
  responseType: "yes" | "no" | undefined;
}

function Row({ message, mine, displayName, role, responseType }: RowProps) {
  return (
    <div className={cn("flex items-start gap-2 max-w-[85%]", mine ? "self-end flex-row-reverse" : "self-start")}>
      <Avatar displayName={displayName} role={role} />
      <div className={cn("flex flex-col gap-0.5 min-w-0", mine ? "items-end" : "items-start")}>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-walnut-3">
          {displayName}
        </span>
        {responseType && (
          <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brass-deep">
            {responseType === "yes" ? "Response · Yes" : "Response · No"}
          </span>
        )}
        <div
          className={cn(
            "rounded-[12px] px-3 py-2 text-[13.5px] leading-snug whitespace-pre-wrap wrap-break-word",
            mine
              ? "bg-bordeaux text-parchment"
              : "bg-parchment-2 border border-border text-walnut",
            responseType === "yes" && "border-success border-2",
            responseType === "no" && "border-bordeaux border-2",
          )}
        >
          {message.body}
        </div>
        {message.dateCreated && (
          <span className="font-mono text-[9.5px] text-walnut-3">
            {message.dateCreated.toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
}

function Avatar({ displayName, role }: { displayName: string; role: RowProps["role"] }) {
  const initial = (displayName.trim()[0] ?? "?").toUpperCase();
  return (
    <div
      aria-hidden="true"
      className={cn(
        "shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-display text-[13px] font-semibold border",
        role === "speaker"
          ? "bg-brass-soft border-brass-soft text-brass-deep"
          : role === "clerk"
            ? "bg-parchment-2 border-border-strong text-walnut-2"
            : "bg-bordeaux border-bordeaux-deep text-parchment",
      )}
    >
      {initial}
    </div>
  );
}
