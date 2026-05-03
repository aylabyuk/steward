import { Switch } from "./Switch";

const CATEGORIES: readonly { id: string; label: string; description: string }[] = [
  {
    id: "reminders",
    label: "Finalization reminders",
    description: "Weekly nudges until Sunday's program is set.",
  },
  {
    id: "assignments",
    label: "New assignment requests",
    description: "Speakers, prayers, or musical numbers requested of you.",
  },
  {
    id: "rsvpChanges",
    label: "RSVP changes",
    description: "When a speaker accepts, declines, or re-schedules.",
  },
];

const DIGEST_OPTS = [
  { id: "off", label: "Off" },
  { id: "daily", label: "Daily at 7am" },
  { id: "weekly", label: "Weekly on Monday" },
];

/** Disabled "what to notify me about" category rows. Wires up when
 *  the per-category preferences backend lands — see follow-up issue
 *  filed alongside this PR. */
export function CategoryRowsComingSoon(): React.ReactElement {
  return (
    <div className="flex flex-col gap-1">
      {CATEGORIES.map((c) => (
        <Switch
          key={c.id}
          checked={false}
          onChange={() => {}}
          label={c.label}
          description={c.description}
          disabled
          badge="Coming soon"
        />
      ))}
    </div>
  );
}

/** Disabled email-digest select. Wires up when the digest Cloud
 *  Function lands — see follow-up issue filed alongside this PR. */
export function DigestSelectComingSoon(): React.ReactElement {
  return (
    <div className="flex items-center gap-2 max-w-md">
      <select
        disabled
        value="off"
        className="font-sans text-[14px] px-2.5 py-1.5 bg-parchment border border-border rounded-md text-walnut-3 w-full max-w-70 cursor-not-allowed"
        aria-label="Email digest frequency"
      >
        {DIGEST_OPTS.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] px-2 py-0.5 bg-parchment-2 text-walnut-3 border border-border rounded-full">
        Coming soon
      </span>
    </div>
  );
}
