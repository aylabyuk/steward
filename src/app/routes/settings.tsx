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
    to: "/settings/templates/speakers",
    label: "Speaker invitation letter",
    desc: "Ward default template shown to speakers + printed letter",
  },
  {
    to: "/settings/templates/ward-invites",
    label: "Ward invitation message",
    desc: "Greeting shown when you invite a new bishopric or clerk member",
  },
];

export function SettingsIndex() {
  return (
    <main className="pb-12">
      <nav className="mb-4 text-sm text-walnut-2">
        <Link to="/schedule" className="hover:text-walnut">
          ← Schedule
        </Link>
      </nav>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-walnut">Settings</h1>
      </header>
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-chalk">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="block px-4 py-3 text-sm hover:bg-parchment-2">
              <span className="font-medium text-walnut">{l.label}</span>
              <span className="block text-xs text-walnut-2">{l.desc}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
