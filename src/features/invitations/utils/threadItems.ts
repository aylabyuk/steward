import type { AuthorInfo, AuthorMap, ChatMessage } from "../hooks/useConversation";

export interface MessageGroup {
  key: string;
  author: string;
  mine: boolean;
  info: AuthorInfo;
  messages: readonly ChatMessage[];
}

export type SystemTone = "success" | "danger" | "neutral";

export type ThreadItem =
  | { kind: "day"; key: string; label: string }
  | { kind: "unread"; key: string }
  | { kind: "system"; key: string; body: string; tone: SystemTone }
  | { kind: "group"; key: string; group: MessageGroup };

export interface BuildOpts {
  messages: readonly ChatMessage[];
  currentIdentity: string | null;
  authors: AuthorMap;
  /** First unread message index (Twilio index, not array index). If
   *  null, no unread divider is inserted. Messages at or after this
   *  index that aren't mine get the divider placed just before them. */
  firstUnreadIndex?: number | null;
  /** "Now" reference for labelling day headers as Today/Yesterday.
   *  Accepting it as a param keeps the builder deterministic and
   *  testable. */
  now?: Date;
}

export function buildThreadItems(opts: BuildOpts): ThreadItem[] {
  const { messages, currentIdentity, authors, firstUnreadIndex, now = new Date() } = opts;
  const items: ThreadItem[] = [];
  let lastDay: string | null = null;
  let unreadInserted = false;
  let currentGroup: MessageGroup | null = null;
  const pushGroup = () => {
    if (currentGroup) items.push({ kind: "group", key: currentGroup.key, group: currentGroup });
    currentGroup = null;
  };
  for (const m of messages) {
    const day = dayKey(m.dateCreated);
    if (day !== lastDay) {
      pushGroup();
      items.push({ kind: "day", key: `day-${day}`, label: dayLabel(m.dateCreated, now) });
      lastDay = day;
    }
    // Structural messages render as centered system notices — no
    // author bubble, no grouping. Posted by participant clients but
    // displayed as neutral thread events.
    if (m.attributes && m.attributes.kind === "status-change") {
      const status = m.attributes.status;
      if (status === "confirmed" || status === "declined") {
        pushGroup();
        const tone: SystemTone = status === "confirmed" ? "success" : "danger";
        items.push({ kind: "system", key: m.sid, body: m.body, tone });
        continue;
      }
    }
    if (m.attributes && m.attributes.kind === "message-deleted") {
      pushGroup();
      items.push({ kind: "system", key: m.sid, body: m.body, tone: "neutral" });
      continue;
    }
    const mine = m.author === currentIdentity;
    if (
      !unreadInserted &&
      !mine &&
      typeof firstUnreadIndex === "number" &&
      m.index >= firstUnreadIndex
    ) {
      pushGroup();
      items.push({ kind: "unread", key: `unread-${m.index}` });
      unreadInserted = true;
    }
    if (currentGroup && currentGroup.author === m.author) {
      currentGroup = { ...currentGroup, messages: [...currentGroup.messages, m] };
      continue;
    }
    pushGroup();
    currentGroup = {
      key: m.sid,
      author: m.author,
      mine,
      info: authors.get(m.author) ?? fallbackAuthor(m.author),
      messages: [m],
    };
  }
  pushGroup();
  return items;
}

function dayKey(d: Date | null): string {
  if (!d) return "no-date";
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(d: Date | null, now: Date): string {
  if (!d) return "Earlier";
  const today = startOfDay(now);
  const that = startOfDay(d);
  const diffDays = Math.round((today.getTime() - that.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(
    undefined,
    sameYear
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" },
  );
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function fallbackAuthor(identity: string): AuthorInfo {
  if (identity.startsWith("speaker:")) return { displayName: "Speaker", role: "speaker" };
  if (identity.startsWith("uid:")) return { displayName: "Bishopric" };
  return { displayName: "Unknown" };
}
