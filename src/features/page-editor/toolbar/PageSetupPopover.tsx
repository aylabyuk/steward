import {
  MARGIN_PRESETS,
  PAGE_SIZES,
  type LetterPageStyle,
  type MarginPreset,
  type Orientation,
  type PageSize,
} from "@/lib/types/template";
import { Icon } from "./Icon";
import { usePopover } from "./hooks/usePopover";

interface Props {
  value: LetterPageStyle | null | undefined;
  onChange: (next: LetterPageStyle) => void;
}

const DEFAULT: LetterPageStyle = {
  borderColor: "none",
  borderWidth: 0,
  borderStyle: "solid",
  paper: "chalk",
  pageSize: "letter",
  orientation: "portrait",
  margins: "narrow",
};

const SIZE_LABELS: Record<PageSize, { label: string; meta: string | null }> = {
  pageless: { label: "Pageless", meta: null },
  letter: { label: "Letter", meta: '8.5" × 11"' },
  a4: { label: "A4", meta: '8.27" × 11.69"' },
  legal: { label: "Legal", meta: '8.5" × 14"' },
  tabloid: { label: "Tabloid", meta: '11" × 17"' },
  a3: { label: "A3", meta: '11.69" × 16.54"' },
  a5: { label: "A5", meta: '5.83" × 8.27"' },
  statement: { label: "Statement", meta: '5.5" × 8.5"' },
  executive: { label: "Executive", meta: '7.25" × 10.5"' },
  folio: { label: "Folio", meta: '8.5" × 13"' },
};

const MARGIN_LABELS: Record<MarginPreset, string> = {
  narrow: "Narrow",
  normal: "Normal",
  wide: "Wide",
};

/** Page setup popover — matches the design kit's `popover--page`
 *  layout: page-size list, orientation segmented control, margins
 *  segmented control, "Currently: …" status line. Replaces the
 *  earlier compact PageSizeDropdown. */
export function PageSetupPopover({ value, onChange }: Props) {
  const pop = usePopover();
  const current = value ?? DEFAULT;

  function set(partial: Partial<LetterPageStyle>) {
    onChange({ ...current, ...partial });
  }

  return (
    <div ref={pop.ref} style={{ position: "relative" }}>
      <button
        type="button"
        title="Page setup"
        className="tb-btn"
        onClick={() => pop.setOpen((o) => !o)}
        onMouseDown={(e) => e.preventDefault()}
      >
        <Icon name="fileText" sw={1.75} />
        <Icon name="chevronDown" size={11} className="caret lucide" sw={2} />
      </button>
      {pop.open && (
        <div
          className="tb-popover tb-popover--page"
          style={{ position: "absolute", top: 38, right: 0 }}
        >
          <div className="tb-page-group">
            <div className="tb-page-group__label">Page size</div>
            <div className="tb-page-group__list">
              {PAGE_SIZES.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  title={
                    SIZE_LABELS[sz].meta
                      ? `${SIZE_LABELS[sz].label} (${SIZE_LABELS[sz].meta})`
                      : SIZE_LABELS[sz].label
                  }
                  className={
                    current.pageSize === sz
                      ? "tb-page-option tb-page-option--active"
                      : "tb-page-option"
                  }
                  onClick={() => set({ pageSize: sz })}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {SIZE_LABELS[sz].label}
                </button>
              ))}
            </div>
          </div>
          <div className="tb-page-group__divider" />
          <div className="tb-page-group">
            <div className="tb-page-group__label">Orientation</div>
            <div className="tb-page-segmented">
              {(["portrait", "landscape"] as Orientation[]).map((o) => (
                <button
                  key={o}
                  type="button"
                  className={
                    current.orientation === o
                      ? "tb-page-segmented__btn tb-page-segmented__btn--active"
                      : "tb-page-segmented__btn"
                  }
                  onClick={() => set({ orientation: o })}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {o[0]!.toUpperCase() + o.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="tb-page-group__divider" />
          <div className="tb-page-group">
            <div className="tb-page-group__label">Margins</div>
            <div className="tb-page-segmented tb-page-segmented--3">
              {MARGIN_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={
                    (current.margins ?? "normal") === m
                      ? "tb-page-segmented__btn tb-page-segmented__btn--active"
                      : "tb-page-segmented__btn"
                  }
                  onClick={() => set({ margins: m })}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {MARGIN_LABELS[m]}
                </button>
              ))}
            </div>
          </div>
          <div className="tb-page-current">
            Currently: {SIZE_LABELS[current.pageSize].label}
            {SIZE_LABELS[current.pageSize].meta ? ` (${SIZE_LABELS[current.pageSize].meta})` : ""} ·{" "}
            {current.orientation} · {MARGIN_LABELS[current.margins ?? "normal"]} margins
          </div>
        </div>
      )}
    </div>
  );
}
