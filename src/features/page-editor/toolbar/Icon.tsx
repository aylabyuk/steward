import * as Lucide from "lucide-react";

/** Maps the design system's icon names to lucide-react components.
 *  Lifted directly from `editor.html`'s ICON_MAP so swapping in a
 *  pixel-perfect implementation keeps the same vocabulary. */
const NAME_MAP: Record<string, keyof typeof Lucide> = {
  undo: "Undo2",
  redo: "Redo2",
  bold: "Bold",
  italic: "Italic",
  underline: "Underline",
  strike: "Strikethrough",
  code: "Code",
  link: "Link",
  plus: "Plus",
  minus: "Minus",
  chevronDown: "ChevronDown",
  chevronUp: "ChevronUp",
  text: "Text",
  heading1: "Heading1",
  heading2: "Heading2",
  heading3: "Heading3",
  list: "List",
  listOrdered: "ListOrdered",
  check: "Check",
  checkSquare: "ListChecks",
  alignLeft: "AlignLeft",
  alignCenter: "AlignCenter",
  alignRight: "AlignRight",
  alignJustify: "AlignJustify",
  quote: "Quote",
  type: "Type",
  paint: "PaintBucket",
  highlight: "Highlighter",
  caseSensitive: "CaseSensitive",
  fileText: "FileText",
  image: "Image",
  table: "Table",
  divider: "Minus",
  smile: "Smile",
  hash: "Hash",
  at: "AtSign",
  trash: "Trash2",
  send: "Send",
  printer: "Printer",
  close: "X",
  arrowLeft: "ArrowLeft",
};

interface Props {
  name: keyof typeof NAME_MAP;
  size?: number;
  sw?: number;
  className?: string;
}

export function Icon({ name, size = 16, sw = 1.75, className = "lucide" }: Props) {
  const lucideName = NAME_MAP[name];
  if (!lucideName) return null;
  const Comp = Lucide[lucideName] as React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
  if (!Comp) return null;
  return <Comp size={size} strokeWidth={sw} className={className} />;
}

export type IconName = keyof typeof NAME_MAP;
