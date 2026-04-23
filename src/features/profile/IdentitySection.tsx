import { Avatar } from "@/components/ui/Avatar";

interface Props {
  uid: string;
  email: string;
  /** Draft name the user is editing. */
  displayName: string;
  /** Google photo URL from the signed-in Firebase user, when present.
   *  The stored member doc's photoURL is written at sign-in via
   *  useMemberProfileSync, so the avatar reflects the latest picture. */
  photoURL: string | null;
  onDisplayNameChange: (value: string) => void;
}

/** Profile → Identity section: 96px avatar, editable display name,
 *  read-only email with Verified chip. Avatar upload is deferred —
 *  the current-user's Google picture is read-only here. */
export function IdentitySection({
  uid,
  email,
  displayName,
  photoURL,
  onDisplayNameChange,
}: Props): React.ReactElement {
  return (
    <section
      id="sec-identity"
      className="bg-chalk border border-border rounded-lg p-6 mb-4 scroll-mt-24"
    >
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep font-medium mb-1">
        You
      </div>
      <h2 className="font-display text-[22px] font-semibold text-walnut mb-1">Profile</h2>
      <p className="font-serif italic text-[14px] text-walnut-2 mb-5">
        How your name and picture appear to the rest of the bishopric.
      </p>

      <div className="flex flex-col gap-2 py-3 border-b border-dashed border-border">
        <label className="font-sans text-[13.5px] font-semibold text-walnut">
          Profile picture
          <span className="block font-serif italic text-[13px] text-walnut-3 font-normal mt-0.5">
            Pulled from your Google account. Shown in the sidebar, in assignment emails, and to
            other bishopric members.
          </span>
        </label>
        <div className="flex items-start gap-5 pt-2">
          <Avatar
            user={{ uid, displayName, photoURL }}
            size="xl"
            className="shadow-[inset_0_0_0_1px_rgba(35,24,21,0.12),0_2px_6px_rgba(35,24,21,0.14)]"
          />
          <p className="font-serif italic text-[13px] text-walnut-3 max-w-xs pt-2">
            {photoURL
              ? "Update your Google profile picture to change what shows here."
              : "Defaulting to your initials. Set a Google profile picture to override."}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-[200px_1fr] gap-y-2 sm:gap-x-6 py-3.5 border-b border-dashed border-border">
        <label
          htmlFor="profile-display-name"
          className="font-sans text-[13.5px] font-semibold text-walnut pt-1.5"
        >
          Display name
          <span className="block font-serif italic text-[13px] text-walnut-3 font-normal mt-0.5">
            Used wherever your name appears in Steward.
          </span>
        </label>
        <div className="min-w-0">
          <input
            id="profile-display-name"
            type="text"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            placeholder="Full name"
            className="font-sans text-[14px] w-full max-w-md px-2.5 py-1.5 bg-parchment border border-border rounded-md text-walnut placeholder:text-walnut-3 placeholder:italic hover:border-border-strong hover:bg-chalk focus:outline-none focus:border-bordeaux focus:bg-chalk focus:ring-2 focus:ring-bordeaux/15 transition-colors"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-[200px_1fr] gap-y-2 sm:gap-x-6 pt-3.5">
        <label className="font-sans text-[13.5px] font-semibold text-walnut pt-1.5">
          Email
          <span className="block font-serif italic text-[13px] text-walnut-3 font-normal mt-0.5">
            From your sign-in. Contact your clerk to change it.
          </span>
        </label>
        <div className="flex items-center gap-2.5 px-3 py-2 bg-parchment border border-border rounded-lg max-w-md">
          <MailIcon />
          <span className="font-mono text-[13px] text-walnut flex-1 truncate">{email}</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] px-2 py-0.5 bg-chalk border border-border text-walnut-3 rounded-full">
            Verified
          </span>
        </div>
      </div>
    </section>
  );
}

function MailIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-walnut-2 shrink-0"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
