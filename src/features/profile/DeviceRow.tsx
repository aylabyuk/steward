import type { Timestamp } from "firebase/firestore";
import type { FcmToken } from "@/lib/types";

interface Props {
  token: FcmToken;
  busy: boolean;
  onRemove: () => void;
}

const PLATFORM_LABELS: Record<FcmToken["platform"], string> = {
  web: "Web",
  ios: "iOS",
  android: "Android",
};

function formatAddedAt(at: unknown): string {
  if (at && typeof at === "object" && "toDate" in (at as object)) {
    return (at as Timestamp).toDate().toLocaleString();
  }
  return "—";
}

/** Single row in the Subscribed devices list: icon + platform name +
 *  added-date, with a Remove button. Per-device naming + "This
 *  device" chip are deferred — see the follow-up issue filed with
 *  this PR. */
export function DeviceRow({ token, busy, onRemove }: Props): React.ReactElement {
  return (
    <li className="grid grid-cols-[38px_1fr_auto] items-center gap-3.5 px-3.5 py-2.5 bg-parchment border border-border rounded-lg">
      <span className="inline-flex items-center justify-center w-8 h-8 bg-chalk border border-border rounded-md text-walnut-2">
        <DeviceIcon platform={token.platform} />
      </span>
      <div className="min-w-0">
        <div className="font-sans text-[14px] font-semibold text-walnut">
          {PLATFORM_LABELS[token.platform]}
        </div>
        <div className="font-mono text-[11px] text-walnut-3 mt-0.5">
          Added {formatAddedAt(token.updatedAt)}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={busy}
        className="font-sans text-[12px] font-semibold px-2.5 py-1 rounded-md border border-danger-soft text-bordeaux hover:bg-danger-soft hover:border-bordeaux hover:text-bordeaux-deep disabled:opacity-50 transition-colors"
      >
        {busy ? "Removing…" : "Remove"}
      </button>
    </li>
  );
}

function DeviceIcon({ platform }: { platform: FcmToken["platform"] }) {
  const mobile = platform === "ios" || platform === "android";
  if (mobile) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    );
  }
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}
