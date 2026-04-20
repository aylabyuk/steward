import { Link } from "react-router";
import { WardSettingsEditor } from "@/features/settings/WardSettingsEditor";

export function WardSettingsPage() {
  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <nav className="mb-4 text-sm text-slate-500">
        <Link to="/settings" className="hover:text-slate-700">
          ← Settings
        </Link>
      </nav>
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-slate-900">Ward settings</h1>
        <p className="text-sm text-slate-500">
          Timezone, lead time, schedule horizon, finalization nudges, and non-meeting Sundays.
        </p>
      </header>
      <WardSettingsEditor />
    </main>
  );
}
