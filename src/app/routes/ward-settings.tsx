import { Link } from "react-router";
import { WardSettingsEditor } from "@/features/settings/WardSettingsEditor";

export function WardSettingsPage() {
  return (
    <main className="max-w-3xl mx-auto pb-12">
      <nav className="mb-4 text-sm text-walnut-2">
        <Link to="/settings" className="hover:text-walnut">
          ← Settings
        </Link>
      </nav>
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-walnut">Ward settings</h1>
        <p className="text-sm text-walnut-2">
          Timezone, lead time, schedule horizon, finalization nudges, and non-meeting Sundays.
        </p>
      </header>
      <WardSettingsEditor />
    </main>
  );
}
