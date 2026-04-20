import { Link } from "react-router";
import { LetterTemplateEditor } from "@/features/speakers/LetterTemplateEditor";

export function LetterTemplatesPage() {
  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <nav className="mb-4 text-sm text-slate-500">
        <Link to="/schedule" className="hover:text-slate-700">
          ← Schedule
        </Link>
      </nav>
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-slate-900">Letter templates</h1>
        <p className="text-sm text-slate-500">
          Edit the per-ward templates used when inviting speakers. Edits to a template don't
          retro-update letters already composed for specific speakers.
        </p>
      </header>
      <LetterTemplateEditor />
    </main>
  );
}
