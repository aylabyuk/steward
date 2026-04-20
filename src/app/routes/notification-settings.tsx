import { Link } from "react-router";
import { DeviceList } from "@/features/notifications/DeviceList";
import { SubscribePrompt } from "@/features/notifications/SubscribePrompt";
import { NotificationPrefsEditor } from "@/features/settings/NotificationPrefsEditor";

export function NotificationSettingsPage() {
  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <nav className="mb-4 text-sm text-walnut-2">
        <Link to="/settings" className="hover:text-walnut">
          ← Settings
        </Link>
      </nav>
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-walnut">Notifications</h1>
        <p className="text-sm text-walnut-2">
          Subscribe this device, manage your registered devices, and choose quiet hours.
        </p>
      </header>
      <SubscribePrompt />
      <div className="flex flex-col gap-6">
        <DeviceList />
        <NotificationPrefsEditor />
      </div>
    </main>
  );
}
