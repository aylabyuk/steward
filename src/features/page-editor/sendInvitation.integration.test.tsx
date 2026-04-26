import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderLetterState } from "./renderLetterState";
import { resolveChipsInState } from "./serializeForInterpolation";
import { interpolate } from "@/features/templates/interpolate";

/** End-to-end simulation of the speaker-letter send → snapshot →
 *  speaker-page chain for a chip the bishop styled (e.g. red color
 *  on the {{topic}} variable):
 *
 *    1. Bishop authors editor state with a chip carrying inline
 *       `style="color: red;"` and `format: italic`.
 *    2. sendSpeakerInvitation runs interpolate(json, vars) +
 *       resolveChipsInState(json, vars).
 *    3. Snapshot stores the result; speaker page reads it and
 *       passes to renderLetterState.
 *    4. The rendered DOM should show the topic text *italic* and
 *       in red.
 *
 *  The previous bug: chip nodes carry their token in a separate
 *  JSON field, so interpolate() (which only replaces `{{...}}`
 *  STRINGS) missed them. resolveChipsInState now walks the tree
 *  and bakes chips into text nodes with their format + style
 *  preserved, so the styling that lives ONLY on the chip
 *  round-trips end-to-end. */
describe("send → snapshot → speaker render — chip styling fidelity", () => {
  function chipState(format: number, style: string) {
    return JSON.stringify({
      root: {
        type: "root",
        version: 1,
        direction: null,
        format: "",
        indent: 0,
        children: [
          {
            type: "paragraph",
            version: 1,
            direction: null,
            format: "",
            indent: 0,
            children: [
              { type: "text", version: 1, format: 0, mode: "normal", style: "", text: "Topic: " },
              { type: "variable-chip", version: 3, token: "topic", format, style },
              { type: "text", version: 1, format: 0, mode: "normal", style: "", text: "." },
            ],
          },
        ],
      },
    });
  }

  it("preserves a chip's color through send → snapshot → render", () => {
    const authored = chipState(0, "color: rgb(220, 38, 38);");
    const vars = { topic: "Faith of our Fathers" };
    // Send-time pipeline (mirrors sendSpeakerInvitation).
    const resolved = resolveChipsInState(interpolate(authored, vars), vars);

    const tree = renderLetterState(resolved);
    const { container } = render(<div>{tree}</div>);

    // The text shows up.
    expect(container.textContent).toContain("Faith of our Fathers");
    // The color applied via inline style on the resolved <span>.
    const styledSpan = container.querySelector('span[style*="color"]');
    expect(styledSpan).toBeTruthy();
    expect(styledSpan?.textContent).toBe("Faith of our Fathers");
    expect(styledSpan?.getAttribute("style")).toMatch(/color:\s*rgb\(220,\s*38,\s*38\)/);
  });

  it("preserves a chip's italic + color together (combined format + style)", () => {
    const authored = chipState(2 /* italic */, "color: #8B2E2A;");
    const vars = { topic: "Faith of our Fathers" };
    const resolved = resolveChipsInState(interpolate(authored, vars), vars);

    const { container } = render(<div>{renderLetterState(resolved)}</div>);

    // Italic wraps the text.
    const em = container.querySelector("em");
    expect(em).toBeTruthy();
    expect(em?.textContent).toBe("Faith of our Fathers");
    // Color applies on the surrounding styled span.
    const styledSpan = container.querySelector('span[style*="color"]');
    expect(styledSpan?.getAttribute("style")).toMatch(/color:\s*(#8B2E2A|rgb)/i);
  });

  it("preserves font-family + font-size patches the bishop applied to the chip", () => {
    const authored = chipState(0, "font-family: Inter; font-size: 20px;");
    const vars = { topic: "Faith of our Fathers" };
    const resolved = resolveChipsInState(interpolate(authored, vars), vars);

    const { container } = render(<div>{renderLetterState(resolved)}</div>);

    const styled = container.querySelector("span[style]");
    const styleStr = styled?.getAttribute("style") ?? "";
    expect(styleStr).toContain("font-family");
    expect(styleStr).toContain("Inter");
    expect(styleStr).toContain("font-size");
    expect(styleStr).toContain("20px");
  });

  it("falls back to {{token}} text when the var bag is missing the key — but the style is still applied", () => {
    const authored = chipState(0, "color: red;");
    const resolved = resolveChipsInState(interpolate(authored, {}), {});

    const { container } = render(<div>{renderLetterState(resolved)}</div>);

    expect(container.textContent).toContain("{{topic}}");
    const styled = container.querySelector('span[style*="color"]');
    expect(styled?.textContent).toBe("{{topic}}");
  });
});
