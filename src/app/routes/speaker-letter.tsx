import { Link, Navigate, useParams } from "react-router";
import { LetterComposer } from "@/features/speakers/LetterComposer";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function SpeakerLetter() {
  const { date, id } = useParams<{ date: string; id: string }>();
  if (!date || !ISO_DATE.test(date) || !id) {
    return <Navigate to="/schedule" replace />;
  }

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <nav className="mb-4 text-sm text-slate-500">
        <Link to={`/week/${date}`} className="hover:text-slate-700">
          ← Back to the week
        </Link>
      </nav>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Speaker letter</h1>
      </header>
      <LetterComposer date={date} speakerId={id} />
    </main>
  );
}
