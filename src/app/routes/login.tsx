import { Navigate } from "react-router";
import { useAuthStore } from "@/stores/authStore";

export function Login() {
  const status = useAuthStore((state) => state.status);
  const signIn = useAuthStore((state) => state.signIn);

  if (status === "signed_in") {
    return <Navigate to="/" replace />;
  }

  const isLoading = status === "loading";

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
      </div>
    </main>
  );
}
