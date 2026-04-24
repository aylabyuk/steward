import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { BubbleActions } from "./BubbleActions";
import { BubbleEditForm } from "./BubbleEditForm";
import type { ChatMessage } from "./useConversation";

export type BubblePosition = "single" | "first" | "middle" | "last";

export function bubblePositionOf(index: number, total: number): BubblePosition {
  if (total === 1) return "single";
  if (index === 0) return "first";
  if (index === total - 1) return "last";
  return "middle";
}

const THEIRS_RADIUS: Record<BubblePosition, string> = {
  single: "rounded-[18px]",
  first: "rounded-[18px] rounded-bl-[4px]",
  middle: "rounded-r-[18px] rounded-l-[4px]",
  last: "rounded-[18px] rounded-tl-[4px]",
};

const MINE_RADIUS: Record<BubblePosition, string> = {
  single: "rounded-[18px]",
  first: "rounded-[18px] rounded-br-[4px]",
  middle: "rounded-l-[18px] rounded-r-[4px]",
  last: "rounded-[18px] rounded-tr-[4px]",
};

interface Props {
  message: ChatMessage;
  mine: boolean;
  position: BubblePosition;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (nextBody: string) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
}

/** A single Messenger-style speech bubble with optional hover-actions
 *  (edit / delete) on the avatar-opposite side. Response-type
 *  messages keep a small "Response · Yes/No" eyebrow above the body
 *  and a colored 2px border. */
export function ConversationBubble({
  message,
  mine,
  position,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: Props): React.ReactElement {
  const responseType = message.attributes?.responseType as "yes" | "no" | undefined;
  const radius = mine ? MINE_RADIUS[position] : THEIRS_RADIUS[position];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) return;
    setDraft(message.body);
    const el = textareaRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing, message.body]);

  async function save() {
    if (!onEdit) return;
    const next = draft.trim();
    if (!next || next === message.body) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onEdit(next);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
      {responseType && (
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brass-deep mb-0.5">
          {responseType === "yes" ? "Response · Yes" : "Response · No"}
        </span>
      )}
      <div className={cn("group flex items-center gap-1", mine ? "flex-row" : "flex-row-reverse")}>
        {!editing && (
          <BubbleActions
            mine={mine}
            canEdit={Boolean(canEdit && onEdit)}
            canDelete={Boolean(canDelete && onDelete)}
            onEdit={() => setEditing(true)}
            onDelete={() => {
              if (onDelete) void onDelete();
            }}
          />
        )}
        <div
          className={cn(
            "px-3.5 py-2 text-[14px] leading-snug whitespace-pre-wrap wrap-break-word shadow-[0_1px_0_rgba(35,24,21,0.04)] min-w-0",
            radius,
            mine ? "bg-bordeaux text-parchment" : "bg-parchment-2 border border-border text-walnut",
            responseType === "yes" && "border-success border-2",
            responseType === "no" && "border-bordeaux border-2",
          )}
        >
          {editing ? (
            <BubbleEditForm
              draft={draft}
              setDraft={setDraft}
              onCancel={() => setEditing(false)}
              onSave={save}
              saving={saving}
              mine={mine}
              textareaRef={textareaRef}
            />
          ) : (
            message.body
          )}
        </div>
      </div>
      {message.dateUpdated &&
        message.dateCreated &&
        message.dateUpdated.getTime() > message.dateCreated.getTime() && (
          <span
            className={cn(
              "font-mono text-[9px] uppercase tracking-[0.14em] text-walnut-3 mt-0.5",
              mine ? "pr-1" : "pl-1",
            )}
          >
            Edited
          </span>
        )}
    </div>
  );
}
