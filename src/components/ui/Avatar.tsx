import { useState } from "react";
import { cn } from "@/lib/cn";
import { avatarPaletteFor, initialsOf } from "@/lib/initials";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

interface User {
  uid?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

interface Props {
  user: User;
  size?: AvatarSize;
  /** Extra class names for the root — used by callers to tweak
   *  positioning (e.g. `shrink-0`) without owning the avatar's core
   *  dimensions. */
  className?: string;
}

const SIZE_PX: Record<AvatarSize, number> = { sm: 24, md: 32, lg: 40, xl: 96 };
const SIZE_CLS: Record<AvatarSize, string> = {
  sm: "w-6 h-6 text-[9.5px]",
  md: "w-8 h-8 text-[11px]",
  lg: "w-10 h-10 text-[13px]",
  xl: "w-24 h-24 text-[32px]",
};

/** Round avatar for a user. Renders, in priority order:
 *   1. Google profile photo (photoURL) — with `referrerpolicy` set so
 *      Google's CDN doesn't 403 us, and a silent `onError` swap to
 *      initials if the image fails.
 *   2. Two-letter initials on a deterministic-color background so the
 *      same uid always shows the same color across the app.
 *   3. A neutral silhouette when both photoURL and displayName are
 *      missing (rare — only hits if the user has no identity info). */
export function Avatar({ user, size = "md", className }: Props): React.ReactElement {
  const [imgFailed, setImgFailed] = useState(false);
  const showPhoto = Boolean(user.photoURL) && !imgFailed;
  const name = user.displayName?.trim() || null;
  const label = name ?? "Unknown user";
  const dims = SIZE_CLS[size];
  const pixelSize = SIZE_PX[size];

  if (showPhoto) {
    return (
      <img
        src={user.photoURL ?? ""}
        alt={label}
        width={pixelSize}
        height={pixelSize}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={cn("rounded-full object-cover border border-border shrink-0", dims, className)}
      />
    );
  }

  if (!name) {
    return (
      <span
        role="img"
        aria-label={label}
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-border bg-parchment-2 text-walnut-3 shrink-0",
          dims,
          className,
        )}
      >
        <SilhouetteIcon />
      </span>
    );
  }

  const palette = avatarPaletteFor(user.uid ?? name);
  return (
    <span
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-display font-semibold shrink-0",
        dims,
        palette.bg,
        palette.fg,
        palette.border,
        className,
      )}
    >
      <span aria-hidden="true">{initialsOf(name)}</span>
    </span>
  );
}

function SilhouetteIcon() {
  return (
    <svg width="55%" height="55%" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" />
    </svg>
  );
}
