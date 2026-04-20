import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase", () => ({ auth: {} }));
vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

const { useAuthStore, handleAuthChange } = await import("./authStore");

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, status: "loading" });
  });

  it("starts in loading state", () => {
    const { user, status } = useAuthStore.getState();
    expect(status).toBe("loading");
    expect(user).toBeNull();
  });

  it("transitions to signed_in when handleAuthChange receives a user", () => {
    const fakeUser = { uid: "u1", email: "bishop@example.com" } as never;
    handleAuthChange(fakeUser);
    const { user, status } = useAuthStore.getState();
    expect(status).toBe("signed_in");
    expect(user).toBe(fakeUser);
  });

  it("transitions to signed_out when handleAuthChange receives null", () => {
    handleAuthChange(null);
    const { user, status } = useAuthStore.getState();
    expect(status).toBe("signed_out");
    expect(user).toBeNull();
  });
});
