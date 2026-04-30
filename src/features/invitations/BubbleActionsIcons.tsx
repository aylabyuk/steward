import { cn } from "@/lib/cn";

const SVG_BASE = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "w-[18px] h-[18px]",
};

export function EditIcon() {
  return (
    <svg {...SVG_BASE}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg {...SVG_BASE}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

interface IconButtonProps {
  label: string;
  danger?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

export function IconButton({ label, danger, onClick, icon }: IconButtonProps) {
  return (
    <button
      role="menuitem"
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "rounded-full w-8 h-8 flex items-center justify-center transition-colors",
        danger ? "text-bordeaux hover:bg-danger-soft/60" : "text-walnut hover:bg-parchment-2",
      )}
    >
      {icon}
    </button>
  );
}
