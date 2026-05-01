import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderLetterState } from "../renderLetterState";

const stateWithCallout = JSON.stringify({
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
        children: [{ type: "text", version: 1, format: 0, mode: "normal", style: "", text: "Hi" }],
      },
      { type: "assigned-sunday-callout", version: 1 },
      {
        type: "paragraph",
        version: 1,
        direction: null,
        format: "",
        indent: 0,
        children: [{ type: "text", version: 1, format: 0, mode: "normal", style: "", text: "Bye" }],
      },
    ],
  },
});

describe("renderLetterState — assigned-sunday-callout", () => {
  it("renders the callout block with the resolved date when opts.assignedDate is provided", () => {
    const { container } = render(
      <div>{renderLetterState(stateWithCallout, { assignedDate: "Sunday, May 3, 2026" })}</div>,
    );
    expect(container.textContent).toContain("Assigned Sunday");
    expect(container.textContent).toContain("Sunday, May 3, 2026");
  });

  it("renders the placeholder copy when no date is provided (template-authoring view)", () => {
    const { container } = render(<div>{renderLetterState(stateWithCallout)}</div>);
    expect(container.textContent).toContain("Assigned Sunday");
    // Falls back to the same placeholder the live editor shows.
    expect(container.textContent).toContain("Assigned Sunday — set per speaker");
  });

  it("keeps surrounding paragraphs flowing around the callout", () => {
    const { container } = render(
      <div>{renderLetterState(stateWithCallout, { assignedDate: "Sunday, May 3, 2026" })}</div>,
    );
    expect(container.textContent).toContain("Hi");
    expect(container.textContent).toContain("Bye");
  });
});
