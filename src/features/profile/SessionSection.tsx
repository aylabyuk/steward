import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";

/** Profile → Session section. Danger-zoned "Sign out of Steward"
 *  button. UserMenu still hosts its own sign-out — this surface is
 *  here because the prototype calls it out as a parallel affordance. */
export function SessionSection(): React.ReactElement {
  const signOut = useAuthStore((s) => s.signOut);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setBusy(true);
    setError(null);
    try {
      await signOut();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      id="sec-session"
      className="bg-chalk border border-danger-soft rounded-lg p-6 mb-4 scroll-mt-24 bg-gradient-to-b from-bordeaux/[0.025] to-transparent"
    >
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-bordeaux font-medium mb-1">
        Session
      </div>
      <h2 className="font-display text-[22px] font-semibold text-walnut mb-1">Sign out</h2>
      <p className="font-serif italic text-[14px] text-walnut-2 mb-5">
        You'll stay signed in on your other devices.
      </p>

      <div className="grid sm:grid-cols-[200px_1fr] gap-y-2 sm:gap-x-6">
        <span className="font-sans text-[13.5px] font-semibold text-walnut pt-1.5">
          This device
        </span>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={busy}
            className="self-start font-sans text-[13px] font-semibold px-3.5 py-1.5 rounded-md border border-danger-soft bg-chalk text-bordeaux hover:bg-danger-soft hover:border-bordeaux hover:text-bordeaux-deep disabled:opacity-60 transition-colors"
          >
            {busy ? "Signing out…" : "Sign out of Steward"}
          </button>
          {error && <p className="font-sans text-[12px] text-bordeaux">{error}</p>}
        </div>
      </div>
    </section>
  );
}
