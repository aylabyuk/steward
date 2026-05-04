import type { Page1Props } from "../ConductingDesignPage1";
import type { Page2Props } from "../ConductingDesignPage2";

/** Sample meeting data used to render the conducting copy template
 *  preview when no real meeting is in scope (e.g. /settings/templates/
 *  programs). Mirrors the figures from the original Conductors
 *  Page.html mockup — Test Ward, May 31 2026, 9:00 a.m. — so the
 *  bishop sees the same realistic preview shipped with the design. */

export function sampleConductingPage1(wardName: string): Page1Props {
  const dateLong = "Sunday, May 31, 2026";
  return {
    wardName,
    dateLong,
    timeText: "9:00 a.m.",
    presiding: "Bishop Reeves",
    conducting: "Brother Tan",
    pianist: "Sister Lee",
    chorister: "Sister Park",
    visitors: "—",
    agenda: [
      {
        num: "1",
        label: "Announcements",
        value: <span className="italic text-brass-deep">See page 2</span>,
      },
      {
        num: "2",
        label: "Opening hymn",
        value: <HymnValue number="#19" title="We Thank Thee, O God, for a Prophet" />,
        sub: { label: "Invocation", value: "Brother Tan" },
      },
      {
        num: "3",
        label: "Ward business",
        value: <span className="italic text-brass-deep">See page 2</span>,
        sub: {
          label: "Stake business",
          value: <span className="italic text-brass-deep">See page 2</span>,
        },
      },
      {
        num: "4",
        label: "Sacrament hymn",
        value: <HymnValue number="#172" title="In Humility, Our Savior" />,
        cue: {
          text: "Administration of the sacrament — pause for reverence before introducing speakers.",
        },
      },
      {
        num: "5",
        label: "Speaker",
        value: <SpeakerValue name="Brother Park" topic="On the still small voice" />,
        cue: { text: "Welcome the congregation; introduce the speaker briefly." },
      },
      {
        num: "6",
        label: "Musical interlude",
        value: <MusicValue label="Musical number" performer="Sister Lee" />,
      },
      {
        num: "7",
        label: "Speaker",
        value: <SpeakerValue name="Sister Reeves" topic="Faith and works" />,
        cue: { text: "Thank the previous speaker; mention the closing hymn that follows." },
      },
      {
        num: "8",
        label: "Closing hymn",
        value: <HymnValue number="#85" title="How Firm a Foundation" />,
        sub: { label: "Benediction", value: "Sister Park" },
      },
    ],
    footerLeft: `${wardName} · 31 May 2026 · Page 1 of 2`,
  };
}

export function sampleConductingPage2(wardName: string): Page2Props {
  return {
    wardName,
    dateLong: "Sunday, May 31, 2026",
    announcements: "",
    wardBusiness: "",
    stakeBusiness: "",
    footerLeft: `${wardName} · 31 May 2026 · Page 2 of 2`,
  };
}

function HymnValue({ number, title }: { number: string; title: string }) {
  return (
    <>
      <span className="font-semibold whitespace-nowrap">{number}</span>
      <span className="mx-1.5 text-walnut-3">—</span>
      <span>{title}</span>
    </>
  );
}

function SpeakerValue({ name, topic }: { name: string; topic: string }) {
  return (
    <>
      <span>{name}</span>
      <span className="mx-1.5 text-walnut-3">—</span>
      <span className="italic text-walnut-2">{topic}</span>
    </>
  );
}

function MusicValue({ label, performer }: { label: string; performer: string }) {
  return (
    <>
      <span>{label}</span>
      <span className="mx-1.5 text-walnut-3">—</span>
      <span>{performer}</span>
    </>
  );
}
