import { Link } from "react-router";
import { NotificationPrefsEditor } from "@/features/settings/NotificationPrefsEditor";

export function NotificationSettingsPage() {
  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <nav className="mb-4 text-sm text-slate-500">
        <Link to="/settings" className="hover:text-slate-700">
          ← Settings
        </Link>
      </nav>
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
        <p className="text-sm text-slate-500">
          Your personal push notification preferences. Device subscription comes later (Phase 13).
        </p>
      </header>
      <NotificationPrefsEditor />
    </main>
  );
}
