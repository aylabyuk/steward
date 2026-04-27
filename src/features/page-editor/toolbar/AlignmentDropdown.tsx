import { FORMAT_ELEMENT_COMMAND, type ElementFormatType, type LexicalEditor } from "lexical";
import { Icon, type IconName } from "./Icon";
import { usePopover } from "./hooks/usePopover";

interface Props {
  editor: LexicalEditor;
  current: ElementFormatType;
}

interface Option {
  key: ElementFormatType;
  label: string;
  icon: IconName;
}

const OPTIONS: Option[] = [
  { key: "left", label: "Left Align", icon: "alignLeft" },
  { key: "center", label: "Center Align", icon: "alignCenter" },
  { key: "right", label: "Right Align", icon: "alignRight" },
  { key: "justify", label: "Justify Align", icon: "alignJustify" },
];

export function AlignmentDropdown({ editor, current }: Props) {
  const pop = usePopover();
  const active = OPTIONS.find((o) => o.key === current) ?? OPTIONS[0]!;
  return (
    <div ref={pop.ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="tb-select"
        onClick={() => pop.setOpen((o) => !o)}
        onMouseDown={(e) => e.preventDefault()}
      >
        <span className="tb-select__icon">
          <Icon name={active.icon} size={14} />
        </span>
        <span className="tb-select__label">{active.label}</span>
        <Icon name="chevronDown" size={11} sw={2} className="tb-select__caret lucide" />
      </button>
      {pop.open && (
        <div className="tb-popover" style={{ position: "absolute", top: 38, right: 0 }}>
          {OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className="tb-popover__item"
              onClick={() => {
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, opt.key);
                pop.setOpen(false);
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <Icon name={opt.icon} size={16} />
              {opt.label}
              {current === opt.key && (
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
