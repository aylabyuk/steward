/** Personal-touch developer credit. Single source of truth so the
 *  copy stays consistent on the app shell footer and on the public
 *  invite pages. `className` lets the caller position it (footer flow
 *  in AppShell / accept-invite, absolute bottom-left on the
 *  full-viewport speaker invite). */
export function BuiltByCredit({ className = "" }: { className?: string }): React.ReactElement {
  return (
    <span
      className={`font-serif italic text-[10px] text-walnut-3 select-none print:hidden ${className}`}
    >
      This app was built with love and prayer, by Oriel Absin.
    </span>
  );
}
