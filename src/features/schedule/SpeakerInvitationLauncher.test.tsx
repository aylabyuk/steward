import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { WithId } from "@/hooks/_sub";
import type { Speaker } from "@/lib/types";
import { SpeakerInvitationLauncher } from "./SpeakerInvitationLauncher";

function makeSpeaker(partial: Partial<Speaker> & { name: string }): Speaker {
  return {
    name: partial.name,
    email: partial.email ?? "",
    phone: partial.phone ?? "",
    topic: partial.topic ?? "",
    status: partial.status ?? "planned",
    role: partial.role ?? "Member",
  };
}

function row(id: string, speaker: Speaker): WithId<Speaker> {
  return { id, data: speaker };
}

afterEach(() => {
  cleanup();
});

describe("SpeakerInvitationLauncher", () => {
  it("renders planned speakers with a Prepare invitation button", () => {
    render(
      <SpeakerInvitationLauncher
        date="2026-04-26"
        speakers={[row("s1", makeSpeaker({ name: "Sister Reeves", email: "r@x.com" }))]}
      />,
    );
    expect(screen.getByDisplayValue("Sister Reeves")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Open prepare invitation for Sister Reeves/i }),
    ).toBeInTheDocument();
  });

  it("renders invited speakers with an 'already invited' note and no button", () => {
    render(
      <SpeakerInvitationLauncher
        date="2026-04-26"
        speakers={[row("s1", makeSpeaker({ name: "Brother Lee", status: "invited" }))]}
      />,
    );
    expect(screen.getByDisplayValue("Brother Lee")).toBeInTheDocument();
    expect(screen.getByText(/Already invited — open edit mode to change/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Open prepare invitation/i }),
    ).not.toBeInTheDocument();
  });

  it("confirmed speakers render with an 'already confirmed' note", () => {
    render(
      <SpeakerInvitationLauncher
        date="2026-04-26"
        speakers={[row("s1", makeSpeaker({ name: "Sister Park", status: "confirmed" }))]}
      />,
    );
    expect(screen.getByText(/Already confirmed — open edit mode to change/i)).toBeInTheDocument();
  });

  it("Prepare invitation button calls window.open with the expected URL", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(
      <SpeakerInvitationLauncher
        date="2026-04-26"
        speakers={[row("speaker-abc", makeSpeaker({ name: "Sister Reeves" }))]}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Open prepare invitation for Sister Reeves/i }),
    );
    expect(openSpy).toHaveBeenCalledWith(
      "/week/2026-04-26/speaker/speaker-abc/prepare",
      "_blank",
      "noopener,noreferrer",
    );
    openSpy.mockRestore();
  });

  it("renders an empty-state hint when there are no speakers at all", () => {
    render(<SpeakerInvitationLauncher date="2026-04-26" speakers={[]} />);
    expect(screen.getByText(/No speakers yet/i)).toBeInTheDocument();
  });

  it("hides declined speakers from the grid", () => {
    render(
      <SpeakerInvitationLauncher
        date="2026-04-26"
        speakers={[
          row("s1", makeSpeaker({ name: "Planned Person" })),
          row("s2", makeSpeaker({ name: "Declined Person", status: "declined" })),
        ]}
      />,
    );
    expect(screen.getByDisplayValue("Planned Person")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Declined Person")).not.toBeInTheDocument();
  });
});
