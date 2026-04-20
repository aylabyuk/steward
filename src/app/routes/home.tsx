import { Navigate } from "react-router";
import { useAuthStore } from "@/stores/authStore";

export function Home() {
  const { user, status, signOut } = useAuthStore();

  if (status === "loading") {
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-50 text-slate-600">
        <p>Loading…</p>
      </main>
    );
  }

  if (status === "signed_out" || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 text-slate-900">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Steward</h1>
        <p className="mt-2 text-sm text-slate-600">Signed in as {user.email ?? user.uid}.</p>
        <button
          type="button"
          onClick={() => {
            void signOut();
          }}
          className="mt-4 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
        >
          Sign out
        </button>
      </div>
    </main>
  );
}
