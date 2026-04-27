import { describe, expect, it } from "vitest";
import { createEditor } from "lexical";
import {
  $createVariableChipNode,
  VariableChipNode,
  variableChipFormatBit,
} from "../VariableChipNode";

const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_STRIKE = 4;
const FORMAT_UNDERLINE = 8;
const FORMAT_CODE = 16;

/** Run a callback inside a Lexical editor.update context. Lexical
 *  node mutations + getLatest() reads require an active editor — the
 *  helper boots a minimal one with the chip class registered and
 *  forwards the callback's return value out. */
function inEditor<T>(work: () => T): T {
  const editor = createEditor({
    nodes: [VariableChipNode],
    onError: (e) => {
      throw e;
    },
  });
  let captured: T;
  editor.update(
    () => {
      captured = work();
    },
    { discrete: true },
  );
  return captured!;
}

describe("VariableChipNode — format + style round-trip", () => {
  it("toggleFormat flips the right bit per text-format type", () => {
    const format = inEditor(() => {
      const chip = $createVariableChipNode("speakerName");
      chip.toggleFormat("bold");
      chip.toggleFormat("italic");
      chip.toggleFormat("underline");
      return chip.getFormat();
    });
    expect(format).toBe(FORMAT_BOLD | FORMAT_ITALIC | FORMAT_UNDERLINE);
  });

  it("hasFormat reflects current bits", () => {
    const flags = inEditor(() => {
      const chip = $createVariableChipNode("speakerName");
      chip.toggleFormat("bold");
      chip.toggleFormat("italic");
      return {
        bold: chip.hasFormat("bold"),
        italic: chip.hasFormat("italic"),
        strike: chip.hasFormat("strikethrough"),
      };
    });
    expect(flags).toEqual({ bold: true, italic: true, strike: false });
  });

  it("toggleFormat is a toggle — second call clears the bit", () => {
    const result = inEditor(() => {
      const chip = $createVariableChipNode("speakerName");
      chip.toggleFormat("bold");
      chip.toggleFormat("bold");
      return { format: chip.getFormat(), bold: chip.hasFormat("bold") };
    });
    expect(result).toEqual({ format: 0, bold: false });
  });

  it("variableChipFormatBit covers every text format the chip needs", () => {
    expect(variableChipFormatBit("bold")).toBe(FORMAT_BOLD);
    expect(variableChipFormatBit("italic")).toBe(FORMAT_ITALIC);
    expect(variableChipFormatBit("strikethrough")).toBe(FORMAT_STRIKE);
    expect(variableChipFormatBit("underline")).toBe(FORMAT_UNDERLINE);
    expect(variableChipFormatBit("code")).toBe(FORMAT_CODE);
  });

  it("patchStyle accumulates color / background-color / font-family / font-size", () => {
    const props = inEditor(() => {
      const chip = $createVariableChipNode("speakerName");
      chip.patchStyle({ color: "#8B2E2A" });
      chip.patchStyle({ "background-color": "#F6E6C4" });
      chip.patchStyle({ "font-family": "Inter" });
      chip.patchStyle({ "font-size": "20px" });
      return {
        color: chip.getCSSProperty("color"),
        bg: chip.getCSSProperty("background-color"),
        font: chip.getCSSProperty("font-family"),
        size: chip.getCSSProperty("font-size"),
      };
    });
    expect(props).toEqual({
      color: "#8B2E2A",
      bg: "#F6E6C4",
      font: "Inter",
      size: "20px",
    });
  });

  it("patchStyle({prop: null}) clears that property without touching others", () => {
    const props = inEditor(() => {
      const chip = $createVariableChipNode("speakerName");
      chip.patchStyle({ color: "#8B2E2A", "background-color": "#F6E6C4" });
      chip.patchStyle({ "background-color": null });
      return {
        color: chip.getCSSProperty("color"),
        bg: chip.getCSSProperty("background-color"),
      };
    });
    expect(props).toEqual({ color: "#8B2E2A", bg: "" });
  });

  it("exportJSON / importJSON round-trip token + format + style", () => {
    const result = inEditor(() => {
      const chip = $createVariableChipNode("speakerName");
      chip.toggleFormat("bold");
      chip.toggleFormat("italic");
      chip.patchStyle({ color: "#8B2E2A", "font-size": "20px" });
      const json = chip.exportJSON();
      const restored = VariableChipNode.importJSON(json);
      return {
        json,
        token: restored.getToken(),
        bold: restored.hasFormat("bold"),
        italic: restored.hasFormat("italic"),
        color: restored.getCSSProperty("color"),
        size: restored.getCSSProperty("font-size"),
      };
    });
    expect(result.json.token).toBe("speakerName");
    expect(result.json.format).toBe(FORMAT_BOLD | FORMAT_ITALIC);
    expect(result.json.style).toContain("color: #8B2E2A");
    expect(result.json.style).toContain("font-size: 20px");
    expect(result.token).toBe("speakerName");
    expect(result.bold).toBe(true);
    expect(result.italic).toBe(true);
    expect(result.color).toBe("#8B2E2A");
    expect(result.size).toBe("20px");
  });

  it("legacy v2 JSON without `style` still imports cleanly (back-compat)", () => {
    const result = inEditor(() => {
      const restored = VariableChipNode.importJSON({
        type: "variable-chip",
        version: 2,
        token: "wardName",
        format: FORMAT_BOLD,
      } as never);
      return {
        token: restored.getToken(),
        bold: restored.hasFormat("bold"),
        style: restored.getStyle(),
      };
    });
    expect(result).toEqual({ token: "wardName", bold: true, style: "" });
  });
});
