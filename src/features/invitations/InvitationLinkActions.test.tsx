import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./invitationsCallable", () => ({
  callRotateInvitationLink: vi.fn(),
}));

import { callRotateInvitationLink } from "./invitationsCallable";
import { InvitationLinkActions } from "./InvitationLinkActions";
import type { SpeakerInvitation } from "@/lib/types";

const mockFn = vi.mocked(callRotateInvitationLink);

function mkInvitation(overrides: Partial<SpeakerInvitation> = {}): SpeakerInvitation {
  return {
    speakerRef: { meetingDate: "2026-05-03", speakerId: "sp1" },
    assignedDate: "Sunday, May 3, 2026",
    sentOn: "April 22, 2026",
    wardName: "Elk River Ward",
    speakerName: "Sister Jones",
    inviterName: "Bishop Smith",
    bodyMarkdown: "body",
    footerMarkdown: "footer",
    speakerEmail: "jones@example.com",
    speakerPhone: "+14165551234",
    deliveryRecord: [],
    createdAt: new Date() as unknown as SpeakerInvitation["createdAt"],
    ...overrides,
  };
}

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Invitation link actions" }));
}

beforeEach(() => {
  mockFn.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("InvitationLinkActions", () => {
  it("renders an overflow menu trigger, not visible action buttons", () => {
    render(<InvitationLinkActions wardId="w1" invitationId="i1" invitation={mkInvitation()} />);
    expect(screen.queryByText("Copy link")).toBeNull();
    expect(screen.getByRole("button", { name: "Invitation link actions" })).toBeTruthy();
  });

  it("never exposes a Copy link action — the plaintext URL stays server-side", () => {
    render(<InvitationLinkActions wardId="w1" invitationId="i1" invitation={mkInvitation()} />);
    openMenu();
    expect(screen.queryByRole("menuitem", { name: "Copy link" })).toBeNull();
  });

  it("Resend menu item shows both channels when invitation has email + phone", () => {
    render(<InvitationLinkActions wardId="w1" invitationId="i1" invitation={mkInvitation()} />);
    openMenu();
    expect(screen.getByRole("menuitem", { name: "Resend via EMAIL + SMS" })).toBeTruthy();
  });

  it("renders no overflow items when no delivery channel is available", () => {
    const inv = mkInvitation({ speakerEmail: undefined, speakerPhone: undefined });
    render(<InvitationLinkActions wardId="w1" invitationId="i1" invitation={inv} />);
    openMenu();
    expect(screen.queryByRole("menuitem", { name: /Resend/ })).toBeNull();
  });

  it("surfaces a delivery-failed message when every delivery failed", async () => {
    mockFn.mockResolvedValue({
      mode: "rotate",
      deliveryRecord: [{ channel: "sms", status: "failed", error: "twilio: 21610", at: "now" }],
    });
    const inv = mkInvitation({ speakerEmail: undefined });
    render(<InvitationLinkActions wardId="w1" invitationId="i1" invitation={inv} />);
    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Resend via SMS" }));
    await waitFor(() => expect(screen.getByText("Delivery failed.")).toBeTruthy());
  });

  it("reports the channels that actually sent on success", async () => {
    mockFn.mockResolvedValue({
      mode: "rotate",
      deliveryRecord: [
        { channel: "sms", status: "sent", providerId: "SM1", at: "now" },
        { channel: "email", status: "failed", error: "bounced", at: "now" },
      ],
    });
    render(<InvitationLinkActions wardId="w1" invitationId="i1" invitation={mkInvitation()} />);
    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Resend via EMAIL + SMS" }));
    await waitFor(() => expect(screen.getByText("Sent via SMS")).toBeTruthy());
  });
});
