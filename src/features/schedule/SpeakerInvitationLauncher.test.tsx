import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";
import type { WithId } from "@/hooks/_sub";
import type { Speaker } from "@/lib/types";
import { SpeakerInvitationLauncher } from "./SpeakerInvitationLauncher";

// Stub the live Firestore subscription. Each LauncherRow child calls
// this once on mount; we just hand back a no-invitation-yet state so
// the "Prepare invitation" path remains active for planned speakers
// and the "Already X — open conversation" button stays disabled
// (ok for most tests — invitationId is null so the button can't
// actually route anywhere).
vi.mock("@/features/invitations/useLatestInvitation", () => ({
  useLatestInvitation: () => ({ loading: false, invitation: null }),
}));

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

function renderLauncher(speakers: readonly WithId<Speaker>[]) {
  return render(
    <MemoryRouter>
      <SpeakerInvitationLauncher date="2026-04-26" speakers={speakers} onClose={() => {}} />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
});

describe("SpeakerInvitationLauncher", () => {
  it("renders planned speakers with a Prepare invitation button", () => {
    renderLauncher([row("s1", makeSpeaker({ name: "Sister Reeves", email: "r@x.com" }))]);
    expect(screen.getByDisplayValue("Sister Reeves")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Open prepare invitation for Sister Reeves/i }),
    ).toBeInTheDocument();
  });

  it("renders invited speakers with an 'open conversation' button", () => {
    renderLauncher([row("s1", makeSpeaker({ name: "Brother Lee", status: "invited" }))]);
    expect(screen.getByDisplayValue("Brother Lee")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Already invited — open conversation/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Open prepare invitation/i }),
    ).not.toBeInTheDocument();
  });

  it("confirmed speakers render with an 'open conversation' button", () => {
    renderLauncher([row("s1", makeSpeaker({ name: "Sister Park", status: "confirmed" }))]);
    expect(
      screen.getByRole("button", { name: /Already confirmed — open conversation/i }),
    ).toBeInTheDocument();
  });

  it("Prepare invitation button calls window.open with the expected URL", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    renderLauncher([row("speaker-abc", makeSpeaker({ name: "Sister Reeves" }))]);

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
    renderLauncher([]);
    expect(screen.getByText(/No speakers yet/i)).toBeInTheDocument();
  });

  it("hides declined speakers from the grid", () => {
    renderLauncher([
      row("s1", makeSpeaker({ name: "Planned Person" })),
      row("s2", makeSpeaker({ name: "Declined Person", status: "declined" })),
    ]);
    expect(screen.getByDisplayValue("Planned Person")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Declined Person")).not.toBeInTheDocument();
  });
});
