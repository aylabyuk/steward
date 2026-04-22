import { Link } from "react-router";

interface Props {
  title: string;
  body: string | null;
  close?: boolean;
}

/** Centered card for the loading / not-found / done states of
 *  `PrepareInvitationPage`. Extracted so the page stays under the
 *  150-LOC ceiling. */
export function PrepareInvitationPageMessage({ title, body, close }: Props) {
  return (
    <main className="min-h-dvh bg-parchment grid place-items-center p-6">
      <div className="w-full max-w-md rounded-[14px] border border-border-strong bg-chalk p-7 shadow-elev-3 text-center">
        <h1 className="font-display text-[22px] font-semibold text-walnut mb-2">{title}</h1>
        {body && <p className="font-serif text-[14px] text-walnut-2 mb-4">{body}</p>}
        <div className="flex justify-center gap-2">
          {close && (
            <button
              type="button"
              onClick={() => window.close()}
              className="rounded-md border border-border-strong bg-chalk px-3.5 py-2 font-sans text-[13px] font-semibold text-walnut hover:bg-parchment-2"
            >
              Close tab
            </button>
          )}
          <Link
            to="/schedule"
            className="rounded-md border border-bordeaux bg-bordeaux px-3.5 py-2 font-sans text-[13px] font-semibold text-chalk hover:bg-bordeaux-deep"
          >
            Back to Schedule
          </Link>
        </div>
      </div>
    </main>
  );
}
