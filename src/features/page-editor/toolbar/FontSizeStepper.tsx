import { useEffect, useState } from "react";
import type { LexicalEditor } from "lexical";
import { Icon } from "./Icon";
import { patchSelectionStyle } from "./utils/patchStyleWithChips";

interface Props {
  editor: LexicalEditor;
  current: number;
}

export function FontSizeStepper({ editor, current }: Props) {
  const [draft, setDraft] = useState(String(current));
  useEffect(() => setDraft(String(current)), [current]);

  function commit(next: number) {
    const clamped = Math.max(8, Math.min(96, Math.round(next)));
    setDraft(String(clamped));
    patchSelectionStyle(editor, { "font-size": `${clamped}px` });
  }

  return (
    <div className="tb-fontsize" title="Font size">
      <button
        type="button"
        className="tb-fontsize__btn"
        onClick={() => commit(current - 1)}
        onMouseDown={(e) => e.preventDefault()}
      >
        <Icon name="minus" size={12} sw={2.25} />
      </button>
      <input
        className="tb-fontsize__input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit(parseInt(draft, 10) || current)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit(parseInt(draft, 10) || current);
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      <button
        type="button"
        className="tb-fontsize__btn"
        onClick={() => commit(current + 1)}
        onMouseDown={(e) => e.preventDefault()}
      >
        <Icon name="plus" size={12} sw={2.25} />
      </button>
    </div>
  );
}
