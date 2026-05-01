import { useEffect } from "react";
import { useNavigate } from "react-router";

interface Props {
  title: string;
  body: string | null;
  /** When set, renders a "Back to schedule" button and auto-navigates
   *  to /schedule after 3s. Used by the Prepare Invitation page's
   *  success state. */
  backToSchedule?: boolean;
}

const AUTO_NAV_MS = 3000;

/** Centered card for the loading / not-found / done states of
 *  `PrepareInvitationPage`. Extracted so the page stays under the
 *  150-LOC ceiling. */
export function PrepareInvitationPageMessage({ title, body, backToSchedule }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!backToSchedule) return;
    const id = window.setTimeout(() => navigate("/schedule"), AUTO_NAV_MS);
    return () => window.clearTimeout(id);
  }, [backToSchedule, navigate]);

  return (
    <main className="min-h-dvh bg-parchment grid place-items-center p-6">
      <div className="w-full max-w-md rounded-[14px] border border-border-strong bg-chalk p-7 shadow-elev-3 text-center">
        <h1 className="font-display text-[22px] font-semibold text-walnut mb-2">{title}</h1>
        {body && <p className="font-serif text-[14px] text-walnut-2 mb-4">{body}</p>}
        {backToSchedule && (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/schedule")}
              className="rounded-md border border-bordeaux bg-bordeaux px-3.5 py-2 font-sans text-[13px] font-semibold text-chalk hover:bg-bordeaux-deep"
            >
              Back to schedule
            </button>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-walnut-3">
              Returning automatically…
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
