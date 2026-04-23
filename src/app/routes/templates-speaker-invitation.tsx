import { useSearchParams } from "react-router";
import { RemoveIcon } from "@/features/schedule/SpeakerInviteIcons";
import { TemplateTabs } from "@/features/templates/TemplateTabs";
import { SpeakerEmailTab } from "./SpeakerEmailTab";
import { SpeakerLetterTab } from "./SpeakerLetterTab";

const TABS = [
  { id: "letter", label: "Letter" },
  { id: "email", label: "Email" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** Combined Speaker-invitation template page. One route hosts both
 *  the printable letter editor and the plain-text email editor; the
 *  active tab lives in the URL so deep links stay bookmarkable.
 *  Opened in its own tab from UserMenu — the letter preview needs the
 *  viewport. */
export function SpeakerInvitationTemplatePage(): React.ReactElement {
  const [params, setParams] = useSearchParams();
  const active: TabId = params.get("tab") === "email" ? "email" : "letter";

  function setTab(id: string) {
    const next = new URLSearchParams(params);
    if (id === "letter") next.delete("tab");
    else next.set("tab", id);
    setParams(next, { replace: true });
  }

  return (
    <main className="min-h-dvh lg:h-dvh bg-parchment flex flex-col lg:overflow-hidden">
      <header className="sticky top-0 z-20 shrink-0 border-b border-border bg-chalk px-4 sm:px-8 pt-4 sm:pt-5 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass-deep">
              Ward template
            </div>
            <h1 className="font-display text-[20px] sm:text-[22px] font-semibold text-walnut leading-tight">
              Speaker invitation template
            </h1>
            <p className="font-serif italic text-[12.5px] text-walnut-3">
              The letter printed on the invite page, and the email sent when you pick "Send email"
              on a planned speaker.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.close()}
            aria-label="Close tab"
            title="Close"
            className="shrink-0 -mr-1 rounded-md p-2 text-walnut-3 hover:text-bordeaux hover:bg-parchment-2 focus:outline-none focus:ring-2 focus:ring-bordeaux/30"
          >
            <RemoveIcon />
          </button>
        </div>
        <TemplateTabs tabs={TABS} active={active} onChange={setTab} />
      </header>

      {active === "letter" ? <SpeakerLetterTab /> : <SpeakerEmailTab />}
    </main>
  );
}
