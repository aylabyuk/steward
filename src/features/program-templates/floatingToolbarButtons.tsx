import type { LexicalEditor, TextFormatType } from "lexical";
import { FORMAT_TEXT_COMMAND } from "lexical";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { cn } from "@/lib/cn";
import { StyleSwatchesButton } from "./StyleSwatchesPopover";

export interface ActiveFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  subscript: boolean;
  superscript: boolean;
  code: boolean;
  link: boolean;
}

export const EMPTY_FORMATS: ActiveFormats = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  subscript: false,
  superscript: false,
  code: false,
  link: false,
};

interface ToolbarButtonsProps {
  editor: LexicalEditor;
  active: ActiveFormats;
}

/** The button row inside the floating toolbar. Pulled out of the
 *  positioning shell so the shell file stays under the 150-LOC cap. */
export function ToolbarButtons({ editor, active }: ToolbarButtonsProps) {
  const fmt = (type: TextFormatType) => editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);
  return (
    <>
      <FmtBtn
        label="Bold"
        active={active.bold}
        className="font-semibold"
        onClick={() => fmt("bold")}
      >
        B
      </FmtBtn>
      <FmtBtn
        label="Italic"
        active={active.italic}
        className="italic"
        onClick={() => fmt("italic")}
      >
        I
      </FmtBtn>
      <FmtBtn
        label="Underline"
        active={active.underline}
        className="underline"
        onClick={() => fmt("underline")}
      >
        U
      </FmtBtn>
      <FmtBtn
        label="Strikethrough"
        active={active.strikethrough}
        className="line-through"
        onClick={() => fmt("strikethrough")}
      >
        S
      </FmtBtn>
      <Sep />
      <FmtBtn label="Subscript" active={active.subscript} onClick={() => fmt("subscript")}>
        X<sub className="text-[8px]">2</sub>
      </FmtBtn>
      <FmtBtn label="Superscript" active={active.superscript} onClick={() => fmt("superscript")}>
        X<sup className="text-[8px]">2</sup>
      </FmtBtn>
      <Sep />
      <FmtBtn
        label="Inline code"
        active={active.code}
        className="font-mono text-[11px]"
        onClick={() => fmt("code")}
      >
        {"</>"}
      </FmtBtn>
      <FmtBtn label="Link" active={active.link} onClick={() => toggleLink(editor, active.link)}>
        <LinkIcon />
      </FmtBtn>
      <Sep />
      <StyleSwatchesButton editor={editor} />
    </>
  );
}

function toggleLink(editor: LexicalEditor, hasLink: boolean) {
  if (hasLink) {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    return;
  }
  const url = window.prompt("Link URL", "https://");
  if (!url) return;
  editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
}

interface FmtBtnProps {
  label: string;
  active?: boolean;
  className?: string;
  onClick: () => void;
  children: React.ReactNode;
}

function FmtBtn({ label, active, className, onClick, children }: FmtBtnProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={cn(
        "h-7 min-w-7 px-1.5 rounded-full grid place-items-center text-[12.5px] text-walnut hover:bg-parchment-2 transition-colors",
        active && "bg-walnut text-parchment hover:bg-walnut-2 hover:text-parchment",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span aria-hidden className="mx-0.5 w-px h-4 bg-border" />;
}

function LinkIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
