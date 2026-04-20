import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

interface Props {
  open: boolean;
  date: string;
  onClose: () => void;
  children?: React.ReactNode;
}

export function AssignDialog({ open, date, onClose, children }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    function handleClickOutside(e: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEsc);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onClose]);

  if (!open) return null;

  const isMobile = window.matchMedia("(max-width: 640px)").matches;

  if (isMobile) {
    // Mobile: slide-over from bottom
    return (
      <div className="fixed inset-0 z-50 flex flex-col">
        <div className="fixed inset-0 bg-black bg-opacity-40" onClick={onClose} />
        <div
          className="absolute bottom-0 left-0 right-0 bg-chalk rounded-t-lg shadow-elev-3 max-h-[90vh] overflow-y-auto animate-[slideIn_0.3s_ease-out]"
          ref={dialogRef}
        >
          <div className="sticky top-0 flex items-center justify-between p-4 border-b border-border bg-parchment-2">
            <h2 className="font-semibold text-walnut">Assign speaker — {date}</h2>
            <button
              onClick={onClose}
              className="text-walnut-2 hover:text-walnut text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    );
  }

  // Desktop: modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-40" onClick={onClose} />
      <div
        className="relative bg-chalk rounded-lg shadow-elev-3 w-full max-w-md p-6 animate-[fadePop_0.2s_ease-out]"
        ref={dialogRef}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-walnut text-lg">Assign speaker</h2>
          <button
            onClick={onClose}
            className="text-walnut-2 hover:text-walnut text-2xl leading-none"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
