import { Switch } from "./Switch";
import { useDevModeStore } from "@/stores/devModeStore";

/** Profile → Developer section. Only rendered when the signed-in
 *  email is on the dev-mode allowlist (see devModeStore.ts). The
 *  testing-number toggle picks between the production outbound SMS
 *  number and the prior one (kept around for production smoke tests).
 *  Server enforces the same allowlist defensively, so unrendered UI
 *  alone isn't the security boundary. */
export function DevModeSection(): React.ReactElement {
  const useTestingNumber = useDevModeStore((s) => s.useTestingNumber);
  const setUseTestingNumber = useDevModeStore((s) => s.setUseTestingNumber);

  return (
    <section
      id="sec-dev"
      className="bg-chalk border border-border rounded-lg p-6 mb-4 scroll-mt-24"
    >
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-walnut-3 font-medium mb-1">
        Developer
      </div>
      <h2 className="font-display text-[22px] font-semibold text-walnut mb-1">Outbound SMS</h2>
      <p className="font-serif italic text-[14px] text-walnut-2 mb-5">
        Routes new invitations through the testing Twilio number instead of the production one.
        Existing chat threads are unaffected.
      </p>

      <Switch
        checked={useTestingNumber}
        onChange={setUseTestingNumber}
        label="Use testing number"
        description="Sends new invitations from the prior production number kept for smoke tests."
      />
    </section>
  );
}
