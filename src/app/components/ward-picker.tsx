import type { MemberAccess } from "@/hooks/useWardAccess";
import { useCurrentWardStore } from "@/stores/currentWardStore";

interface Props {
  members: MemberAccess[];
}

export function WardPicker({ members }: Props) {
  const setWardId = useCurrentWardStore((s) => s.setWardId);

  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Choose a ward</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your account is active in multiple wards. Pick one to continue.
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {members.map((m) => (
            <li key={m.wardId}>
              <button
                type="button"
                onClick={() => {
                  setWardId(m.wardId);
                }}
                className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-left text-sm font-medium text-slate-900 hover:bg-slate-100"
              >
                {m.wardId}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
