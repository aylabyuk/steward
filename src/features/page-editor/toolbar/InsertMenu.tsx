import { useState } from "react";
import type { LexicalEditor } from "lexical";
import { ToolbarButton } from "./ToolbarButton";
import type { SlashCommand } from "../plugins/SlashCommandRegistry";

interface Props {
  editor: LexicalEditor;
  commands: ReadonlyArray<SlashCommand>;
}

/** Insert dropdown — surfaces every slash command as a clickable
 *  menu entry so the bishop doesn't have to type `/` to find them.
 *  Re-uses the same registry the slash plugin consumes, so any
 *  future addition lights up automatically. */
export function InsertMenu({ editor, commands }: Props) {
  const [open, setOpen] = useState(false);
  function fire(cmd: SlashCommand) {
    editor.update(() => cmd.onSelect(editor));
    setOpen(false);
  }
  return (
    <span className="relative inline-flex">
      <ToolbarButton label="Insert" onClick={() => setOpen((o) => !o)} className="gap-1.5">
        <span aria-hidden>＋</span>
        <span className="text-[12px]">Insert</span>
        <span aria-hidden className="text-walnut-3 text-[10px]">
          ▾
        </span>
      </ToolbarButton>
      {open && (
        <div
          role="menu"
          className="absolute top-[calc(100%+4px)] left-0 z-30 w-64 max-h-80 overflow-y-auto rounded-md border border-border-strong bg-chalk shadow-elev-3 py-1"
          onMouseDown={(e) => e.preventDefault()}
        >
          {commands.map((cmd) => (
            <button
              key={cmd.id}
              type="button"
              onClick={() => fire(cmd)}
              className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left hover:bg-parchment-2"
            >
              {cmd.icon && (
                <span className="font-mono text-walnut-2 w-5 text-center">{cmd.icon}</span>
              )}
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] text-walnut">{cmd.label}</span>
                {cmd.description && (
                  <span className="block font-serif italic text-[11.5px] text-walnut-3">
                    {cmd.description}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
