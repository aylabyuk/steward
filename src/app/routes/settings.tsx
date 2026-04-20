import { Link } from "react-router";

const links = [
  {
    to: "/settings/ward",
    label: "Ward settings",
    desc: "Timezone, lead time, nudges, non-meeting Sundays",
  },
  {
    to: "/settings/members",
    label: "Members",
    desc: "Callings, active roster, email CC defaults",
  },
  {
    to: "/settings/notifications",
    label: "Notifications",
    desc: "Your push preferences and quiet hours",
  },
  {
    to: "/settings/letter-templates",
    label: "Letter templates",
    desc: "Speaker invitation templates",
  },
];

export function SettingsIndex() {
  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <nav className="mb-4 text-sm text-slate-500">
        <Link to="/schedule" className="hover:text-slate-700">
          ← Schedule
        </Link>
      </nav>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
      </header>
      <ul className="flex flex-col divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="block px-4 py-3 text-sm hover:bg-slate-50">
              <span className="font-medium text-slate-900">{l.label}</span>
              <span className="block text-xs text-slate-500">{l.desc}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
