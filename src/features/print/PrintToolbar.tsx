import { Link } from "react-router";

interface Props {
  backTo: string;
  backLabel: string;
  children?: React.ReactNode;
}

export function PrintToolbar({ backTo, backLabel, children }: Props) {
  return (
    <nav className="no-print mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 text-sm text-slate-600">
      <Link to={backTo} className="hover:text-slate-900">
        ← {backLabel}
      </Link>
      <div className="flex items-center gap-3">
        {children}
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md bg-slate-900 px-3 py-1 text-sm text-white"
        >
          Print
        </button>
      </div>
    </nav>
  );
}
