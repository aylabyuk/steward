import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

// Reactively stubbed useSpeakers — each test pushes rows in before render.
const speakersState: {
  loading: boolean;
  data: { id: string; data: Speaker }[];
} = { loading: false, data: [] };

vi.mock("@/hooks/useMeeting", () => ({
  useSpeakers: () => speakersState,
}));

afterEach(() => {
  cleanup();
  speakersState.loading = false;
  speakersState.data = [];
});

describe("SpeakerInvitationLauncher", () => {
  it("renders planned speakers with an Open prepare button", () => {
    speakersState.data = [
      { id: "s1", data: makeSpeaker({ name: "Sister Reeves", email: "r@x.com" }) },
    ];
    render(<SpeakerInvitationLauncher date="2026-04-26" />);
    expect(screen.getByText("Sister Reeves")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Open prepare invitation for Sister Reeves/i }),
    ).toBeInTheDocument();
  });

  it("renders invited speakers under 'Already handled' with no button", () => {
    speakersState.data = [
      { id: "s1", data: makeSpeaker({ name: "Brother Lee", status: "invited" }) },
    ];
    render(<SpeakerInvitationLauncher date="2026-04-26" />);
    expect(screen.getByText("Already handled")).toBeInTheDocument();
    expect(screen.getByText("Invited ✓")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Open prepare invitation/i }),
    ).not.toBeInTheDocument();
  });

  it("confirmed speakers render with a 'Confirmed ✓' badge", () => {
    speakersState.data = [
      { id: "s1", data: makeSpeaker({ name: "Sister Park", status: "confirmed" }) },
    ];
    render(<SpeakerInvitationLauncher date="2026-04-26" />);
    expect(screen.getByText("Confirmed ✓")).toBeInTheDocument();
  });

  it("Open prepare button calls window.open with the expected URL", async () => {
    speakersState.data = [{ id: "speaker-abc", data: makeSpeaker({ name: "Sister Reeves" }) }];
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<SpeakerInvitationLauncher date="2026-04-26" />);

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
    speakersState.data = [];
    render(<SpeakerInvitationLauncher date="2026-04-26" />);
    expect(screen.getByText(/No speakers yet/i)).toBeInTheDocument();
  });

  it("hides declined speakers from both lists", () => {
    speakersState.data = [
      { id: "s1", data: makeSpeaker({ name: "Planned Person" }) },
      { id: "s2", data: makeSpeaker({ name: "Declined Person", status: "declined" }) },
    ];
    render(<SpeakerInvitationLauncher date="2026-04-26" />);
    expect(screen.getByText("Planned Person")).toBeInTheDocument();
    expect(screen.queryByText("Declined Person")).not.toBeInTheDocument();
  });
});
