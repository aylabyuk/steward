import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import type { AuthorInfo, AuthorMap, ChatMessage } from "./useConversation";

interface Props {
  messages: readonly ChatMessage[];
  currentIdentity: string | null;
  /** Resolves author identity → `{ displayName, role, photoURL? }`.
   *  Merged across Twilio participant attributes + ward-members
   *  fallback + the current user's auth profile before being passed
   *  in. Used for bubble labels + avatars. */
  authors: AuthorMap;
  loading?: boolean;
}

/** Bubble list for a Twilio conversation. Mine = right-aligned;
 *  others = left-aligned. Structured responseType messages get a
 *  border treatment. Avatar uses photoURL when present, otherwise
 *  two-letter initials from displayName. */
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
        const author = authors.get(m.author) ?? fallbackAuthor(m.author);
        const responseType = m.attributes?.responseType as "yes" | "no" | undefined;
        return (
          <Row
            key={m.sid}
            message={m}
            mine={mine}
            author={author}
            responseType={responseType}
          />
        );
      })}
    </div>
  );
}

function fallbackAuthor(identity: string): AuthorInfo {
  if (identity.startsWith("speaker:")) return { displayName: "Speaker", role: "speaker" };
  if (identity.startsWith("uid:")) return { displayName: "Bishopric" };
  return { displayName: "Unknown" };
}

interface RowProps {
  message: ChatMessage;
  mine: boolean;
  author: AuthorInfo;
  responseType: "yes" | "no" | undefined;
}

function Row({ message, mine, author, responseType }: RowProps) {
  return (
    <div className={cn("flex items-start gap-2 max-w-[85%]", mine ? "self-end flex-row-reverse" : "self-start")}>
      <Avatar author={author} />
      <div className={cn("flex flex-col gap-0.5 min-w-0", mine ? "items-end" : "items-start")}>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-walnut-3">
          {author.displayName}
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

function Avatar({ author }: { author: AuthorInfo }) {
  const colorClass =
    author.role === "speaker"
      ? "bg-brass-soft border-brass-soft text-brass-deep"
      : author.role === "clerk"
        ? "bg-parchment-2 border-border-strong text-walnut-2"
        : "bg-bordeaux border-bordeaux-deep text-parchment";
  if (author.photoURL) {
    return (
      <img
        src={author.photoURL}
        alt=""
        aria-hidden="true"
        className="shrink-0 w-8 h-8 rounded-full object-cover border border-border"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={cn(
        "shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-display text-[11px] font-semibold border",
        colorClass,
      )}
    >
      {initialsOf(author.displayName)}
    </div>
  );
}

function initialsOf(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]!.slice(0, 2) || "?").toUpperCase();
  return `${parts[0]!.charAt(0)}${parts.at(-1)!.charAt(0)}`.toUpperCase();
}
