import type { LexicalEditor } from "lexical";

export interface SlashCommand {
  /** Stable identifier — drives keys + filter matching. */
  id: string;
  /** Display label shown in the typeahead menu. */
  label: string;
  /** Optional one-line description rendered under the label. */
  description?: string;
  /** Comma-separated alias keywords for filter matching, e.g.
   *  "img, picture, photo" so the bishop can find image with multiple
   *  natural words. */
  keywords?: string;
  /** Single-character icon glyph rendered in the menu (✦, ⌘, ¶, etc.).
   *  We avoid icon fonts here to keep the slash menu lightweight. */
  icon?: string;
  /** Fired when the option is committed via Enter or click. The
   *  registry passes the live editor so commands can dispatch
   *  custom commands or call `editor.update`. */
  onSelect: (editor: LexicalEditor) => void;
}

export function filterSlashCommands(
  commands: ReadonlyArray<SlashCommand>,
  query: string,
): SlashCommand[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [...commands];
  return commands.filter((c) => {
    const haystack = `${c.label} ${c.id} ${c.keywords ?? ""}`.toLowerCase();
    return haystack.includes(q);
  });
}
