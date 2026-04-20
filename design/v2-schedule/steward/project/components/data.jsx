// Schedule data + shared helpers
// Mock "today" is Apr 20, 2026 (Monday) — one Sunday just passed, next is Apr 26.

const TODAY = new Date(2026, 3, 20); // Apr 20, 2026

function daysUntil(d) {
  const ms = d.getTime() - TODAY.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function fmtDate(d) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function fmtCountdown(d) {
  const n = daysUntil(d);
  if (n < 0) return `${Math.abs(n)} days ago`;
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n < 14) return `In ${n} days`;
  const weeks = Math.round(n / 7);
  return `In ${weeks} weeks`;
}

function monthName(m) {
  return ["January","February","March","April","May","June","July","August","September","October","November","December"][m];
}

// build 13 Sundays starting Apr 26, 2026 (quarter-ish view)
function buildSundays(monthsAhead = 3) {
  // Start from the first Sunday strictly after TODAY, go through N months out.
  const start = new Date(TODAY);
  const daysToNextSunday = (7 - start.getDay()) % 7 || 7;
  start.setDate(start.getDate() + daysToNextSunday);

  const end = new Date(TODAY);
  end.setMonth(end.getMonth() + monthsAhead);

  // Kind overrides by YYYY-M-D key (fast/stake/general Sundays we know about).
  const kindBy = {
    "2026-4-3":  "fast",
    "2026-4-10": "stake",
    "2026-5-7":  "fast",
    "2026-5-14": "general",
    "2026-6-5":  "fast",
    "2026-7-2":  "fast",
    "2026-8-6":  "fast",
  };
  // Sample speakers on a couple of specific dates.
  const speakersBy = {
    "2026-3-26": [
      { name: "Sebastian Tan", email: "sebastian@example.com", topic: "Repentance", role: "Member", state: "planned" },
      { name: "Jane Doe", email: "", topic: "Faith", role: "Member", state: "planned" },
    ],
    "2026-5-21": [
      { name: "Sister Hannah Reeves", email: "hannah.r@example.com", topic: "On the still, small voice", role: "Member", state: "confirmed" },
    ],
  };

  const list = [];
  const d = new Date(start);
  while (d <= end) {
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    list.push({
      date: new Date(d),
      kind: kindBy[key] || "regular",
      speakers: speakersBy[key] ? speakersBy[key].map(s => ({...s})) : [],
    });
    d.setDate(d.getDate() + 7);
  }

  return list.map((s, i) => ({ id: `s${i}`, ...s }));
}

const ROLE_OPTIONS = ["Member", "Youth", "High Council", "Visiting"];
const STATE_OPTIONS = [
  { id: "planned",   label: "Planned" },
  { id: "invited",   label: "Invited" },
  { id: "confirmed", label: "Confirmed" },
  { id: "declined",  label: "Declined" },
];

// Icon helper — tiny inline SVGs, no external deps
function Icon({ name, size = 14 }) {
  const props = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor", strokeWidth: "1.75",
    strokeLinecap: "round", strokeLinejoin: "round",
  };
  switch (name) {
    case "plus": return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case "mail": return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>;
    case "send": return <svg {...props}><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>;
    case "check": return <svg {...props}><path d="M20 6L9 17l-5-5"/></svg>;
    case "x": return <svg {...props}><path d="M18 6L6 18M6 6l12 12"/></svg>;
    case "chevron-down": return <svg {...props}><path d="M6 9l6 6 6-6"/></svg>;
    case "chevron-up": return <svg {...props}><path d="M6 15l6-6 6 6"/></svg>;
    case "alert": return <svg {...props}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case "trash": return <svg {...props}><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14"/></svg>;
    case "user": return <svg {...props}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    case "clock": return <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
    case "printer": return <svg {...props}><path d="M6 9V2h12v7"/><rect x="3" y="9" width="18" height="9" rx="2"/><path d="M6 14h12v7H6z"/></svg>;
  }
  return null;
}

Object.assign(window, {
  TODAY, daysUntil, fmtDate, fmtCountdown, monthName,
  buildSundays, ROLE_OPTIONS, STATE_OPTIONS, Icon,
});
