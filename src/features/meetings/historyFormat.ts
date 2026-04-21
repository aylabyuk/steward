import type { HistoryAction, HistoryTarget } from "./history";
import type { HistoryChange } from "@/lib/types";

const FIELD_LABELS: Record<string, string> = {
  openingHymn: "Opening hymn",
  sacramentHymn: "Sacrament hymn",
  closingHymn: "Closing hymn",
  openingPrayer: "Opening prayer",
  benediction: "Benediction",
  pianist: "Pianist",
  chorister: "Chorister",
  presiding: "Presiding",
  conducting: "Conducting",
  sacramentBread: "Sacrament bread",
  sacramentBlessers: "Sacrament blessers",
  mid: "Musical interlude",
  showAnnouncements: "Show announcements",
  wardBusiness: "Ward business",
  stakeBusiness: "Stake business",
  announcements: "Announcements",
  meetingType: "Meeting type",
  cancellation: "Cancellation",
  status: "Status",
  letterBody: "Letter body",
  name: "Name",
  topic: "Topic",
  email: "Email",
  invalidated: "Invalidated approvals",
  live: "Live approvals",
};

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

function valueLabel(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "string") return v.length > 60 ? `${v.slice(0, 57)}…` : v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;
    if ("number" in obj && "title" in obj) return `#${obj.number} ${obj.title}`;
    if ("person" in obj || "status" in obj) {
      const a = obj as { person?: { name?: string } | null; status?: string };
      const name = a.person?.name ?? "(unassigned)";
      const status = a.status ? ` (${a.status.replace(/_/g, " ")})` : "";
      return `${name}${status}`;
    }
    if ("name" in obj && typeof obj.name === "string") return obj.name;
    return "(updated)";
  }
  return String(v);
}

function targetLabel(target: HistoryTarget, action: HistoryAction): string {
  if (target === "meeting" && action === "create") return "created the meeting";
  if (target === "speaker" && action === "create") return "added a speaker";
  if (target === "speaker" && action === "update") return "updated a speaker";
  if (target === "speaker" && action === "delete") return "removed a speaker";
  if (target === "comment" && action === "create") return "posted a comment";
  if (target === "comment" && action === "update") return "edited a comment";
  if (target === "comment" && action === "delete") return "deleted a comment";
  if (target === "approval" && action === "create") return "approved the meeting";
  if (target === "approval" && action === "update") return "invalidated approvals";
  return "updated the meeting";
}

export interface FormattedEvent {
  summary: string;
  details: string[];
}

export function formatHistoryEvent(input: {
  actorDisplayName: string;
  target: HistoryTarget;
  action: HistoryAction;
  changes: HistoryChange[];
}): FormattedEvent {
  const summary = `${input.actorDisplayName} ${targetLabel(input.target, input.action)}`;
  const details = input.changes.map((c) => {
    const name = fieldLabel(c.field);
    if (c.old === undefined && c.new === undefined) return name;
    if (c.old === undefined) return `${name}: ${valueLabel(c.new)}`;
    if (c.new === undefined) return `${name}: ${valueLabel(c.old)} → —`;
    return `${name}: ${valueLabel(c.old)} → ${valueLabel(c.new)}`;
  });
  return { summary, details };
}
