import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { z } from "zod";

// Mock firebase/firestore so the hook never actually subscribes to a
// real backend in this unit test. The fix under test is purely about
// the LOADING flag while the path key is still null — we never need
// onSnapshot to fire.
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({})),
  onSnapshot: vi.fn(() => () => {}),
  collection: vi.fn(() => ({})),
}));
vi.mock("@/lib/firebase", () => ({ db: {} }));

// Auth store factory — let each test set the auth status.
const setAuthStatus = vi.fn();
vi.mock("@/stores/authStore", () => ({
  useAuthStore: (selector: (s: { status: string }) => unknown) =>
    selector({ status: setAuthStatus.getMockImplementation()?.() ?? "signed_in" }),
}));

import { useDocSnapshot } from "./_sub";

const schema = z.object({ x: z.string() });

beforeEach(() => {
  setAuthStatus.mockReset();
  setAuthStatus.mockImplementation(() => "signed_in");
});

describe("useDocSnapshot loading semantics", () => {
  it("stays loading=true when a path segment is undefined (e.g. wardId not yet resolved)", () => {
    const { result } = renderHook(() =>
      useDocSnapshot(["wards", undefined, "templates", "speakerLetter"], schema),
    );
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it("stays loading=true when a path segment is an empty string", () => {
    const { result } = renderHook(() =>
      useDocSnapshot(["wards", "", "templates", "speakerLetter"], schema),
    );
    expect(result.current.loading).toBe(true);
  });

  it("stays loading=true when the user is signed out (segments still computable but auth blocks)", () => {
    setAuthStatus.mockImplementation(() => "signed_out");
    const { result } = renderHook(() =>
      useDocSnapshot(["wards", "stv1", "templates", "speakerLetter"], schema),
    );
    expect(result.current.loading).toBe(true);
  });

  it("stays loading=true when auth is still loading and segments are filled in", () => {
    setAuthStatus.mockImplementation(() => "loading");
    const { result } = renderHook(() =>
      useDocSnapshot(["wards", "stv1", "templates", "speakerLetter"], schema),
    );
    expect(result.current.loading).toBe(true);
  });
});
