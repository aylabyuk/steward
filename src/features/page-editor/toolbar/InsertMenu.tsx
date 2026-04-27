import type { LexicalEditor } from "lexical";
import { Icon } from "./Icon";
import { usePopover } from "./hooks/usePopover";
import type { SlashCommand } from "../plugins/SlashCommandRegistry";

interface Props {
  editor: LexicalEditor;
  commands: ReadonlyArray<SlashCommand>;
}

/** Insert dropdown — surfaces every slash command as a clickable
 *  menu entry so the bishop doesn't need to type `/` to find them.
 *  Re-uses the same registry the slash plugin consumes. */
export function InsertMenu({ editor, commands }: Props) {
  const pop = usePopover();
  function fire(cmd: SlashCommand) {
    editor.update(() => cmd.onSelect(editor));
    pop.setOpen(false);
  }
  return (
    <div ref={pop.ref} style={{ position: "relative" }}>
      <button
        type="button"
        title="Insert"
        className="tb-btn"
        onClick={() => pop.setOpen((o) => !o)}
        onMouseDown={(e) => e.preventDefault()}
      >
        <Icon name="plus" sw={2.2} />
        <span>Insert</span>
        <Icon name="chevronDown" size={11} className="caret lucide" sw={2} />
      </button>
      {pop.open && (
        <div
          className="tb-popover"
          style={{
            position: "absolute",
            top: 38,
            left: 0,
            minWidth: 240,
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {commands.map((cmd) => (
            <button
              key={cmd.id}
              type="button"
              className="tb-popover__item"
              onClick={() => fire(cmd)}
              onMouseDown={(e) => e.preventDefault()}
            >
              {cmd.icon && (
                <span
                  aria-hidden
                  style={{ width: 18, textAlign: "center", color: "var(--color-brass-deep)" }}
                >
                  {cmd.icon}
                </span>
              )}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13, color: "var(--color-walnut)" }}>
                  {cmd.label}
                </span>
                {cmd.description && (
                  <span
                    style={{
                      display: "block",
                      fontFamily: "var(--font-serif)",
                      fontStyle: "italic",
                      fontSize: 11.5,
                      color: "var(--color-walnut-3)",
                    }}
                  >
                    {cmd.description}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
