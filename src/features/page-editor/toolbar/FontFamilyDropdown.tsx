import type { LexicalEditor } from "lexical";
import { Icon } from "./Icon";
import { patchSelectionStyle } from "./utils/patchStyleWithChips";
import { usePopover } from "./hooks/usePopover";

const FONT_FAMILIES = [
  "Newsreader",
  "Inter",
  "IBM Plex Mono",
  "Georgia",
  "Helvetica",
  "Cormorant Garamond",
  "Times New Roman",
];

interface Props {
  editor: LexicalEditor;
  current: string;
}

export function FontFamilyDropdown({ editor, current }: Props) {
  const pop = usePopover();
  function apply(family: string) {
    patchSelectionStyle(editor, { "font-family": family });
    pop.setOpen(false);
  }
  return (
    <div ref={pop.ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="tb-select tb-font-select"
        onClick={() => pop.setOpen((o) => !o)}
        onMouseDown={(e) => e.preventDefault()}
      >
        <span className="tb-select__icon">
          <Icon name="type" size={14} />
        </span>
        <span className="tb-select__label" style={{ fontFamily: current }}>
          {current}
        </span>
        <Icon name="chevronDown" size={11} sw={2} className="tb-select__caret lucide" />
      </button>
      {pop.open && (
        <div className="tb-popover" style={{ position: "absolute", top: 38, left: 0 }}>
          {FONT_FAMILIES.map((f) => (
            <button
              key={f}
              type="button"
              className="tb-popover__item"
              style={{ fontFamily: f }}
              onClick={() => apply(f)}
              onMouseDown={(e) => e.preventDefault()}
            >
              {f}
              {current === f && (
                <span className="kbd">
                  <Icon name="check" size={14} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
