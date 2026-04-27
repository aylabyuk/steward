import { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { cn } from "@/lib/cn";
import { filterSlashCommands, type SlashCommand } from "./utils/SlashCommandRegistry";

class SlashOption extends MenuOption {
  constructor(public command: SlashCommand) {
    super(command.id);
  }
}

interface Props {
  commands: ReadonlyArray<SlashCommand>;
}

/** Slash-command menu. Type `/` at the start of a paragraph to open
 *  a typeahead with the host editor's registered commands; ↑/↓
 *  navigate, Enter commits, Esc closes. Built on Lexical's official
 *  `LexicalTypeaheadMenuPlugin` so it integrates with the editor's
 *  selection / undo / IME handling for free. */
export function SlashCommandPlugin({ commands }: Props) {
  const [editor] = useLexicalComposerContext();
  const [query, setQuery] = useState<string | null>(null);
  const checkForSlash = useBasicTypeaheadTriggerMatch("/", { minLength: 0 });

  const filtered = useMemo(
    () => filterSlashCommands(commands, query ?? "").map((c) => new SlashOption(c)),
    [commands, query],
  );

  const onSelect = useCallback(
    (option: SlashOption, _nodeToReplace: unknown, closeMenu: () => void) => {
      editor.update(() => option.command.onSelect(editor));
      closeMenu();
    },
    [editor],
  );

  return (
    <LexicalTypeaheadMenuPlugin<SlashOption>
      onQueryChange={setQuery}
      onSelectOption={onSelect}
      triggerFn={checkForSlash}
      options={filtered}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) => {
        if (anchorElementRef.current === null || filtered.length === 0) return null;
        return createPortal(
          <div className="z-50 w-72 rounded-lg border border-border-strong bg-chalk shadow-elev-3 py-1 max-h-72 overflow-y-auto">
            {filtered.map((option, idx) => (
              <button
                key={option.key}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onClick={() => selectOptionAndCleanUp(option)}
                className={cn(
                  "w-full px-3 py-2 flex items-start gap-2.5 text-left transition-colors",
                  selectedIndex === idx
                    ? "bg-parchment-2"
                    : "bg-transparent hover:bg-parchment-2/60",
                )}
              >
                {option.command.icon && (
                  <span className="shrink-0 w-5 h-5 grid place-items-center font-mono text-walnut-2">
                    {option.command.icon}
                  </span>
                )}
                <span className="flex-1 min-w-0">
                  <span className="block font-sans text-[13px] text-walnut">
                    {option.command.label}
                  </span>
                  {option.command.description && (
                    <span className="block font-serif italic text-[11.5px] text-walnut-3">
                      {option.command.description}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>,
          anchorElementRef.current,
        );
      }}
    />
  );
}
