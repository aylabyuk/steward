import { useState } from "react";
import { Navigate } from "react-router";
import { useAuthStore } from "@/stores/authStore";

const isEmulator = import.meta.env.VITE_USE_EMULATORS === "true";

export function Login() {
  const status = useAuthStore((state) => state.status);
  const signIn = useAuthStore((state) => state.signIn);
  const signInWithEmail = useAuthStore((state) => state.signInWithEmail);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (status === "signed_in") {
    return <Navigate to="/" replace />;
  }

  const isLoading = status === "loading";

  async function emailSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Steward</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in with the Google account linked to your ward.
        </p>
        <button
          type="button"
          onClick={() => {
            void signIn();
          }}
          disabled={isLoading}
          className="mt-6 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Loading…" : "Continue with Google"}
        </button>
        {isEmulator && (
          <form onSubmit={emailSignIn} className="mt-6 flex flex-col gap-2 border-t pt-4">
            <p className="text-xs font-medium text-slate-500">Emulator-only sign-in</p>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              data-testid="e2e-email"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              data-testid="e2e-password"
            />
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
              data-testid="e2e-signin"
            >
              Sign in
            </button>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </form>
        )}
      </div>
    </main>
  );
}
