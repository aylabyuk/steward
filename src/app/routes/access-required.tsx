import { useAuthStore } from "@/stores/authStore";

export function AccessRequired() {
  const { user, signOut } = useAuthStore();
  const email = user?.email ?? "your account";

  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Access required</h1>
        <p className="mt-2 text-sm text-slate-600">
          We couldn't find an active ward membership for <b>{email}</b>. Ask your bishopric to
          invite this Google account.
        </p>
        <button
          type="button"
          onClick={() => {
            void signOut();
          }}
          className="mt-6 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
        >
          Sign out
        </button>
      </div>
    </main>
  );
}
