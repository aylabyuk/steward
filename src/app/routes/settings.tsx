import { Link } from "react-router";

interface SettingsLink {
  to: string;
  label: string;
  desc: string;
  /** Open in a new tab so the full-width editor layout gets its own
   *  window — matches the Prepare Invitation flow. */
  newTab?: boolean;
}

const links: SettingsLink[] = [
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
    to: "/settings/profile",
    label: "Profile",
    desc: "Your name, avatar, push notifications, and quiet hours",
  },
  {
    to: "/settings/templates/speakers",
    label: "Speaker invitation letter",
    desc: "Ward default template shown to speakers + printed letter",
    newTab: true,
  },
  {
    to: "/settings/templates/speaker-email",
    label: "Speaker invitation email",
    desc: "Plain-text email body when you hit Send email on a planned speaker",
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
            <Link
              to={l.to}
              target={l.newTab ? "_blank" : undefined}
              rel={l.newTab ? "noopener noreferrer" : undefined}
              className="block px-4 py-3 text-sm hover:bg-parchment-2"
            >
              <span className="font-medium text-walnut">
                {l.label}
                {l.newTab && (
                  <span
                    aria-label="Opens in a new tab"
                    className="ml-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-walnut-3"
                  >
                    ↗ new tab
                  </span>
                )}
              </span>
              <span className="block text-xs text-walnut-2">{l.desc}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
