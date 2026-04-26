import { useState } from "react";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import type { LexicalEditor } from "lexical";
import { EditPropModal } from "../EditPropModal";
import { Icon } from "./Icon";
import { ToolbarButton } from "./ToolbarButton";

interface Props {
  editor: LexicalEditor;
  active: boolean;
}

/** Add-link / remove-link toolbar button. Replaces the previous
 *  inline window.prompt("Enter URL") with the in-app EditPropModal
 *  so URL entry uses the same modal chrome as every other prop
 *  editor in the page-editor surface. */
export function LinkButton({ editor, active }: Props) {
  const [open, setOpen] = useState(false);
  function onClick() {
    if (active) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      return;
    }
    setOpen(true);
  }
  function save(url: string) {
    const trimmed = url.trim();
    if (trimmed) editor.dispatchCommand(TOGGLE_LINK_COMMAND, trimmed);
    setOpen(false);
  }
  return (
    <>
      <ToolbarButton label={active ? "Remove link" : "Add link"} active={active} onClick={onClick}>
        <Icon name="link" />
      </ToolbarButton>
      <EditPropModal
        open={open}
        title="Add link URL"
        initial="https://"
        onSave={save}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
