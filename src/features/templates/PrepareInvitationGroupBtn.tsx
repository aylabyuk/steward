interface Props {
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  /** Small walnut dot tucked under the icon to signal "this speaker
   *  currently has an override that Revert will clear". */
  indicator?: boolean;
  position: "first" | "mid" | "last";
  label: string;
  children: React.ReactNode;
}

/** Single segment of the Prepare Invitation toolbar's connected
 *  button group. Extracted so the action bar stays under the 150-LOC
 *  ceiling. */
export function PrepareInvitationGroupBtn({
  onClick,
  disabled,
  primary,
  indicator,
  position,
  label,
  children,
}: Props) {
  const rounded = position === "first" ? "rounded-l-md" : position === "last" ? "rounded-r-md" : "";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={[
        "relative inline-flex items-center justify-center px-3 py-2 sm:px-3.5 sm:py-2.5",
        "border transition-colors focus:outline-none focus:z-10 focus:ring-2 focus:ring-bordeaux/30",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        rounded,
        position !== "first" && "-ml-px",
        primary
          ? "bg-bordeaux text-chalk border-bordeaux-deep hover:bg-bordeaux-deep disabled:hover:bg-bordeaux"
          : "bg-chalk text-walnut border-border-strong hover:bg-parchment-2 disabled:hover:bg-chalk",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
      {indicator && (
        <span aria-hidden className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-bordeaux" />
      )}
    </button>
  );
}
